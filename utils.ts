import fs from "fs";
import parse from "csv-parse";

export const read = {
  csv: function (path): Promise<any[]> {
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

export const diff = (array) => {
  let arrayOfDiffs = [];
  for (let i = 0; i < array.length - 1; i++) {
    let diff = array[i + 1] - array[i];
    arrayOfDiffs.push(diff);
  }
  return arrayOfDiffs;
};

export const sort = (array) => {
  return array.sort(function (a, b) {
    return a - b;
  });
};

export const sum = (array) => {
  let sum = 0;
  for (let i = 0; i < array.length; i++) sum += array[i];
  return sum;
};

export const mean = (x: number[]): number => {
  let sum = 0;
  for (let i = 0; i < x.length; i++) sum += x[i];
  return sum / x.length;
};

const data = {
  columnA: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  columnB: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  columnC: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
};
const path = "./ts-result.csv";

export function fromJsonToCsv(data, path) {
  const keys = Object.keys(data);
  fs.appendFileSync(path, keys.map((key) => `"${key}"`).join(",") + "\n");
  for (let i = 0; i < data[keys[0]].length; i++) {
    let row = [];
    for (let j = 0; j < keys.length; j++) {
      row.push(data[keys[j]][i]);
    }
    fs.appendFileSync(path, row.join(",") + "\n");
  }
}



// from array of objects to object with arrays
export function fromArrayToObject(data: any[]) {
  let result: any = {};
  for (let i = 0; i < data.length; i++) {
    for (const [key, value] of Object.entries(data[i])) {
      if (!result[key]) result[key] = [];
      result[key].push(value);
    }
  }
  return result;
}