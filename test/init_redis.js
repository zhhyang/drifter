/**
 * Created by freeman on 16-4-7.
 */

"use strict";

var request = require('request');

for (let i=1;i<6;i++) {
    request.post({
        url: "http://127.0.0.1:3000/bottles",
        json: {"owner": "bottle" + i, "type": "male", "content": "content" + i}
    });
}

for (let i=6;i<=10;i++) {
    request.post({
        url: "http://127.0.0.1:3000/bottles",
        json: {"owner": "bottle" + i, "type": "male", "content": "content" + i}
    });
}

