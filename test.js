var fs = require("fs");
var parse = require("csv-parse");


const path = "./SiteDataFile_Villegas_NT.csv";


function getParseCsv(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, function (err, data) {
            if (err) {
                reject(err);
            }
            parse(data, { columns: true }, function (err, output) {
                if (err) {
                    reject(err);
                }
                resolve(output);
            });
        });
    });
}



async function saveCSVData(){
    var data = await getParseCsv(path);
    console.log(data);
}

 saveCSVData();


function sortArray(array) {
    var sortedArray = array.sort(function (a, b) {
        return a.id - b.id;
    });
    return sortedArray;
}





const array = [1, 3, 6, 2, 9];


function diff(array){
    var arrayOfDiffs = [];
    for(var i = 0; i < array.length -1; i++){
        var diff = array[i+1] - array[i];
        arrayOfDiffs.push(diff);
    }
    return arrayOfDiffs;
}





function sort(array){
    var sortedArray = array.sort(function (a, b) {
        return a - b;
    });
    return sortedArray;
}



const read = {
  csv: function (path) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, function (err, data) {
        if (err) {
          reject(err);
        }
        parse(data, { columns: true }, function (err, output) {
          if (err) {
            reject(err);
          }
          resolve(output);
        });
      });
    });
  },
};

function sum(array){
    var sum = 0;
    for(var i = 0; i < array.length; i++)
        sum += array[i];
    return sum;
}

  const dataRequire = [
    "site",
    "year",
    "sand",
    "cinput",
    "ligfrac",
    "nfrac",
    "irrig",
    "till",
  ];
  if (!dataRequire.every((x) => paramsDataValues.hasOwnProperty(x))) {
    return console.log(
      `missing data for ${dataRequire} in ${ParameterFilePath}`
    );
  }