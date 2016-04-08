/**
 * Created by Freeman on 2016/4/8.
 */
var mongoose = require('mongoose');

mongoose.connect(
    'mongodb://localhost/drifter',
    {
        server: {
            poolSize: 10
        }
    }
);

var BottleSchema = new mongoose.Schema({
    bottle: Array,
    message: Array
}, {
    collection: 'bottles'
});

var bottleModel = mongoose.model('Model',BottleSchema);


function save(picker,_bottle, callback) {

    var bottle = {bottle: [], message: []};
    bottle.bottle.push(picker);
    bottle.message.push([_bottle.owner, _bottle.time, _bottle.content]);

    bottle = new bottleModel(bottle);
    bottle.save(function (err) {
        callback(err);
    });

}

exports.save = save;



// 获取用户捡到的所有漂流瓶
function getAll(user, callback) {
    bottleModel.find({"bottle": user}, function (err, bottles) {
        if (err) {
            return callback({code: 0, msg: "获取漂流瓶列表失败..."});
        }
        callback({code: 1, msg: bottles});
    });
}

exports.getAll = getAll;


function getOne(_id, callback) {
    // 通过 id 获取特定的漂流瓶
    bottleModel.findById(_id, function (err, bottle) {
        if (err) {
            return callback({code: 0, msg: "读取漂流瓶失败..."});
        }
        // 成功时返回找到的漂流瓶
        callback({code: 1, msg: bottle});
    });
}

// 获取特定 id 的漂流瓶
exports.getOne = getOne;