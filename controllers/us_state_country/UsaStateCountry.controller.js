
const shapefile = require('shapefile');
const path = require('path');
const axios = require('axios');
const RESPONSE_CODES = require('../../constants/RESPONSE_CODES');
const RESPONSE_STATUS = require('../../constants/RESPONSE_STATUS');
const userName = "alphabas"; 

const readShpFile = async (fileName) => {
    const pathToShp = path.join('public/us_state_data/', fileName);

    const features = [];

    try {
        const source = await shapefile.open(pathToShp);
        while (true) {
            const result = await source.read();
            if (result.done) break;
            features.push(result.value);
        }
    } catch (error) {
        console.error(error);
        throw new Error('Error reading shapefile');
    }

    return features;
};


// GET DENSITY WITH LAT AND LONG
async function getLoadingDensity(latitude, longitude) {
    try {
        const response = await axios.get(`http://api.geonames.org/findNearbyPlaceNameJSON?lat=${latitude}&lng=${longitude}&username=${userName}`);
        
        if (response.data && response.data.geonames && response.data.geonames.length > 0) {
            const place = response.data.geonames[0];
            return place.population; 
        } else {
            console.log('No pop');
            return null;
        }
    } catch (error) {
        console.error('Error fetching population data:', error);
        return null;
    }
}


async function getDensity(latitude, longitude, areaDensity) {
    const population = await getLoadingDensity(latitude, longitude);

    if (population !== null) {
        const density = calculateDensity(population, areaDensity);
        return density 
    } else {
        console.log('Could not retrieve population data.');
    }
}


const getZoomLevel = (density) => {
    let zoomLevel;
  
    switch (true) {
      case (density <= 60):
        zoomLevel = 6;  // Low density
        break;
      case (density <= 150):
        zoomLevel = 7;  // Medium density
        break;
      case (density <= 300):
        zoomLevel = 10; // High density
        break;
      default:
        zoomLevel = 12; // My def densityy
    }
  
    return zoomLevel;
  }


  const runingIsBusinessArea = (block) => {
    const businessLandUses = ["Commercial", "Mixed-use", "Industrial"];
    const businessIndicators = block.density > 60 ;
  
    return businessLandUses.includes(block.landUse) || businessIndicators;
  };




const getCurrentDataCountry = async (req, res) => {
    const { rows, first, sortField, sortOrder, search, latitude, longitude, zoom, business_type, areaDensity } = req.query;
    

    try {
        const rowsPerPage = parseInt(rows);
        const startIndex = parseInt(first);
        const features = await readShpFile('tl_2021_us_county.shp');

        //PAGINATION INTGRATE
        const paginatedData = features.slice(startIndex, startIndex + rowsPerPage);

        //GROUP AND  DELETE THE DOUBLONS
        const currentElement = paginatedData.reduce((acc, feature) => {
            const coords = feature.geometry.coordinates;
            const areaData = 9.8e6;
            const densElement = 120;
            coords.forEach(polygon => {
                polygon.forEach(async coord => {
                    // const densElement = await getDensity(coord[0], coord[1],areaData); 
                    const latLong = { lat: coord[0], long: coord[1], dens : 120 };
                    // VER DOUBLON
                    const exists = acc.some(item => item.lat === latLong.lat && item.long === latLong.long);
                    if (!exists) {
                        acc.push(latLong);
                    }
                });
            });
            return acc;
        }, []);

        // Filter who the population density and ajust zoom level > 100
        const arr = []  
        
        
        const filteredData = currentElement.forEach(item => {
            if(item.dens > 50){
                const zoom = getZoomLevel(item.dens);
                arr.push({
                    lat : item.lat,
                    long : item.long,
                    density: item.dens,
                    zoom : zoom,
                    // landUse : "Commercial"
                    landUse : item?.landUse 
                })
                
            }
        //   return arr  
          });
        
        //   console.log("++++++++",arr
          // Filter the census blocks Remove Census Blocks that are unlikely to contain businesses and Prioritize urban and commercial areas.
          const filteredBlocks = arr?.filter(block => runingIsBusinessArea(block));
            console.log("+ARR+",filteredBlocks)

        // Fityilter 
        const filteredElements = filteredBlocks.filter(item => {
            const latCondition = latitude 
              ? String(item.lat).includes(latitude) 
              : true; 
            const longCondition = longitude 
              ? String(item.long).includes(longitude) 
              : true;   
            return latCondition && longCondition;
          });

          const resultElements = (filteredElements.length > 0 || latitude || longitude) ? filteredElements : currentElement;

          // filter by zom value

        //   const filteredZoomData = resultElements.filter(el => el.zoom === zoom);

          const filteredZoomData = zoom !== "" && resultElements.some(el => el.zoom === zoom)
          ? resultElements.filter(el => el.zoom === zoom)
          : resultElements;

          console.log("++++++++++++=",resultElements)
        res.status(RESPONSE_CODES.OK).json({
            statusCode: RESPONSE_CODES.OK,
            httpStatus: RESPONSE_STATUS.OK,
            message: "List census DATA...!",
            result: {
                data: filteredZoomData,
                counter: filteredZoomData.length,
                totoals: currentElement.length
            },
        });
    } catch (error) {
        res.status(500).send(error.message);
    }

};


module.exports = { getCurrentDataCountry };