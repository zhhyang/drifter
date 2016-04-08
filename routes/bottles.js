/**
 * Created by Freeman on 2016/4/7.
 */


var express = require('express'),
    router = express.Router(),
    redis = require('../models/redis'),
    mongodb = require('../models/mongodb');

/* GET bottles listing. */
// 捡一个漂流瓶
// GET /bottles?user=xxx[&type=xxx]
router.get('/', function(req, res, next) {
    if (!req.query.user) {
        return res.json({code: 0, msg: "信息不完整"});
    }
    if (req.query.type && (["male", "female"].indexOf(req.query.type) === -1)) {
        return res.json({code: 0, msg: "类型错误"});
    }
    redis.pick(req.query, function (result) {
        if (result.code === 1){
            mongodb.save(req.query.user,result.msg,function (err) {
                if (err) {
                    return res.json({code: 0, msg: "获取漂流瓶失败，请重试"});
                }
                return res.json(result);
            })
        }
        res.json(result);
    });
});
// 扔一个漂流瓶
// POST /bottles owner=xxx&type=xxx&content=xxx[&time=xxx]
router.post('/',function (req,res,next) {
    console.log(req.body.owner);
    console.log(req.body.type);
    console.log(req.body.content);

    if (!(req.body.owner && req.body.type && req.body.content)) {
        return res.json({code: 0, msg: "信息不完整"});
    }
    if (req.body.type && (["male", "female"].indexOf(req.body.type) === -1)) {
        return res.json({code: 0, msg: "类型错误"});
    }
    redis.throw(req.body, function (result) {
        return res.json(result);
    });
});

//
router.get('/:_id',function (req,res,next) {
    mongodb.getOne(req.params._id, function (result) {
        res.json(result);
    });
});



module.exports = router;