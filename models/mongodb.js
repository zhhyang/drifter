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


// 回复特定 id 的漂流瓶
function reply(_id, reply, callback) {
    reply.time = reply.time || Date.now();
    // 通过 id 找到要回复的漂流瓶
    bottleModel.findById(_id, function (err, _bottle) {
        if (err) {
            return callback({code: 0, msg: "回复漂流瓶失败..."});
        }
        var newBottle = {};
        newBottle.bottle = _bottle.bottle;
        newBottle.message = _bottle.message;
        // 如果捡瓶子的人第一次回复漂流瓶，则在 bottle 键添加漂流瓶主人
        // 如果已经回复过漂流瓶，则不再添加
        if (newBottle.bottle.length === 1) {
            newBottle.bottle.push(_bottle.message[0][0]);
        }
        // 在 message 键添加一条回复信息
        newBottle.message.push([reply.user, reply.time, reply.content]);
        // 更新数据库中该漂流瓶信息
        bottleModel.findByIdAndUpdate(_id, newBottle, function (err, bottle) {
            if (err) {
                return callback({code: 0, msg: "回复漂流瓶失败..."});
            }
            // 成功时返回更新后的漂流瓶信息
            callback({code: 1, msg: bottle});
        });
    });
}

exports.reply = reply;

function _delete(_id, callback) {
    // 通过 id 查找并删除漂流瓶
    bottleModel.findByIdAndRemove(_id, function (err) {
        if (err) {
            return callback({code: 0, msg: "删除漂流瓶失败..."});
        }
        callback({code: 1, msg: "删除成功！"});
    });
}

// 删除特定 id 的漂流瓶
exports.delete = _delete;