/**
 * Created by Freeman on 2016/4/7.
 */


var redis = require('redis'),
    uuid = require('node-uuid'),
    poolModule = require('generic-pool');

var pool = poolModule.Pool({
    name     : 'redisPool',
    create   : function(callback) {
        var client = redis.createClient();
        callback(null, client);
    },
    destroy  : function(client) {
        client.quit();
    },
    max      : 100,
    min      : 5,
    idleTimeoutMillis : 30000,
    log      : true
});



function throwOneBottle(bottle,callback) {

    bottle.time = bottle.time || Date.now();

    // 为每个漂流瓶随机生成一个 id
    var bottleId = uuid.v4();

    var type = {
        male: 0,
        female: 1
    };

    pool.acquire(function (err,client) {
        if (err) {
            return callback({code: 0, msg: err});
        }

        client.select(type[bottle.type],function () {
            client.hmset(bottleId,bottle,function (err,result) {
                if (err) {
                    return callback({code: 0, msg: "过会儿再试试吧！"});
                }
                client.expire(bottleId,(86400000+bottle.time - Date.now())/1000,function () {
                    pool.release(client);
                });
                // 返回结果，成功时返回 OK
                callback({code: 1, msg: result});
            })
        })
    })
}

function throwa(bottle,callback) {
    throwOneBottle(bottle,function (result) {
        callback(result);
    })
}

exports.throw = throwa;


function pickOneBottle(info,callback) {
    var type = {
        all: Math.round(Math.random()),
        male: 0,
        female: 1
    };


    info.type = info.type || 'all';

    pool.acquire(function (err,client) {
        if (err){
            return callback({code: 0, msg: err});
        }

        client.select(type[info.type],function () {
            
            client.RANDOMKEY(function (err,bottleId) {
                if (err) {
                    return callback({code: 0, msg: err});
                }
                if (!bottleId) {
                    return callback({code: 1, msg: "海星"});
                }

                client.HGETALL(bottleId,function (err,bottle) {
                    if (err) {
                        return callback({code: 0, msg: "漂流瓶破损了..."});
                    }

                    client.del(bottleId,function () {
                        pool.release(client);
                    });
                    callback({code: 1,msg: bottle})
                })
            })
        });
    })
}

function pick(info,callback) {
    // 20% 概率捡到海星
    if (Math.random() <= 0.2) {
        return callback({code: 1, msg: "海星"});
    }
    pickOneBottle(info,function (result) {
        callback(result)
    });
}

exports.pick = pick;