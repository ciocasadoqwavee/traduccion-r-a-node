import fs from "fs";
import parse from "csv-parse";

export const read = {
  csv(path): Promise<any[]> {
    return new Promise((resolve, reject) => {
      fs.readFile(path, (err, data) => {
        if (err) {
          reject(err);
        }
        parse(data, { columns: true }, (error, output) => {
          if (error) {
            reject(error);
          }
          resolve(output);
        });
      });
    });
  },
};

export const diff = (array) => {
  const arrayOfDiffs = [];
  for (let i = 0; i < array.length - 1; i++) {
    const difference = array[i + 1] - array[i];
    arrayOfDiffs.push(difference);
  }
  return arrayOfDiffs;
};

export const sort = (array) => {
  return array.sort((a, b) => a - b);
};

export const sum = (array) => {
  let acumulator = 0;
  for (const value of array) acumulator += value;
  return acumulator;
};

export const mean = (array: number[]): number => {
  let acumulator = 0;
  for (const value of array) acumulator += value;
  return acumulator / array.length;
};

export function fromJsonToCsv(data, path) {
  const keys = Object.keys(data);
  fs.appendFileSync(path, keys.map((key) => `"${key}"`).join(",") + "\n");
  for (let i = 0; i < data[keys[0]].length; i++) {
    const row = [];
    // tslint:disable-next-line: prefer-for-of
    for (let j = 0; j < keys.length; j++) {
      row.push(data[keys[j]][i]);
    }
    fs.appendFileSync(path, row.join(",") + "\n");
  }
}

// from array of objects to object with arrays
export function fromArrayToObject(data: any[]) {
  const result: any = {};
  for (const obj of data) {
    for (const [key, value] of Object.entries(obj)) {
      if (!result[key]) result[key] = [];
      result[key].push(value);
    }
  }
  return result;
}

export function hasAllConsecutiveNumbers(array: number[]): boolean {
  if (array.length === 0) return false;
  for (let i = 0; i < array.length - 1; i++) {
    if (array[i + 1] - array[i] !== 1) {
      return false;
    }
  }
  return true;
}

export function getAmountOfMissingProps(
  props: string[],
  object: object
): number {
  return props.filter((prop) => !object.hasOwnProperty(prop)).length;
}
