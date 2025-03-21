
const shapefile = require('shapefile');
const path = require('path');
const RESPONSE_CODES = require('../../constants/RESPONSE_CODES');
const RESPONSE_STATUS = require('../../constants/RESPONSE_STATUS');

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


const getCurrentDataCountry = async (req, res) => {
    const { rows, first, sortField, sortOrder, search, latitude, longitude } = req.query;
    

    try {
        const rowsPerPage = parseInt(rows);
        const startIndex = parseInt(first);
        const features = await readShpFile('tl_2021_us_county.shp');

        //PAGINATION INTGRATE
        const paginatedData = features.slice(startIndex, startIndex + rowsPerPage);

        //GROUP AND  DELETE THE DOUBLONS
        const currentElement = paginatedData.reduce((acc, feature) => {
            const coords = feature.geometry.coordinates;

            coords.forEach(polygon => {
                polygon.forEach(coord => {
                    const latLong = { lat: coord[0], long: coord[1] };
                    // VER DOUBLON
                    const exists = acc.some(item => item.lat === latLong.lat && item.long === latLong.long);
                    if (!exists) {
                        acc.push(latLong);
                    }
                });
            });
            return acc;
        }, []);


        // Filter 
        const filteredElements = currentElement.filter(item => {
            const latCondition = latitude 
              ? String(item.lat).includes(latitude) 
              : true; 
            const longCondition = longitude 
              ? String(item.long).includes(longitude) 
              : true;   
            return latCondition && longCondition;
          });

          const resultElements = (filteredElements.length > 0 || latitude || longitude) ? filteredElements : currentElement;

        res.status(RESPONSE_CODES.OK).json({
            statusCode: RESPONSE_CODES.OK,
            httpStatus: RESPONSE_STATUS.OK,
            message: "List census DATA...!",
            result: {
                data: resultElements,
                counter: resultElements.length,
                totoals: currentElement.length
            },
        });
    } catch (error) {
        res.status(500).send(error.message);
    }

};


module.exports = { getCurrentDataCountry };