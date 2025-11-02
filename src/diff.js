// import {createTwoFilesPatch} from 'diff'
// import fs from 'node:fs';
// import path from 'node:path';
// import { fileURLToPath } from 'node:url';
// // import yam1 from '../src/1.txt';
// // import yam2 from '../src/2.txt';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const file1 = path.resolve(__dirname, './1.txt');
// const file2 = path.resolve(__dirname, './2.txt');

// const a = fs.readFileSync(file1, 'utf8');
// const b = fs.readFileSync(file2, 'utf8');

// const t = createTwoFilesPatch('1.txt', '2.txt', a, b,"","");
// console.log(t);


import fs from "fs";
import { diff } from "jsondiffpatch";
import YAML from "yaml";

const oldDoc = YAML.parse(fs.readFileSync("./1.yaml", "utf8"));
const newDoc = YAML.parse(fs.readFileSync("./2.yaml", "utf8"));

const delta = diff(oldDoc, newDoc);

console.log(YAML.stringify(delta, null, 2));