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
    //在用户扔瓶子前，首先到 2 号数据库中检查该用户对应的值（即扔瓶次数）是否超过 10 。
    // 如果超过 10 ，返回错误信息，
    // 如果没有超过 10 ，则将该用户对应的扔瓶次数加 1 ，并设置用户键的生存期。
    checkThrowTimes(bottle.owner,function (result) {
        if (result.code === 0) {
            return callback(result);
        }
        throwOneBottle(bottle,function (result) {
            callback(result);
        });
    });
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
    checkPickTimes(info.user,function (result) {

        if (result.code === 0) {
            return callback(result);
        }
        // 20% 概率捡到海星
        if (Math.random() <= 0.2) {
            return callback({code: 1, msg: "海星"});
        }
        pickOneBottle(info,function (result) {
            callback(result);
        });
    });
}

exports.pick = pick;


// 检查用户是否超过扔瓶次数限制
function checkThrowTimes(owner, callback) {
    pool.acquire(function (err, client) {
        if (err) {
            return callback({code: 0, msg: err});
        }
        // 到2号数据库检查用户是否超过扔瓶次数限制
        client.SELECT(2, function() {
            // 获取该用户捡瓶次数
            client.GET(owner, function (err, result) {
                if (result >= 10) {
                    return callback({code: 0, msg: "今天扔瓶子的机会已经用完啦~"});
                }
                // 捡瓶次数加 1
                client.INCR(owner, function() {
                    // 检查是否是当天第一次扔瓶子
                    // 若是，则设置记录该用户扔瓶次数键的生存期为 1 天
                    // 若不是，生存期保持不变
                    client.TTL(owner, function (err, ttl) {
                        if (ttl === -1) {
                            client.EXPIRE(owner, 86400, function () {
                                // 释放连接
                                pool.release(client);
                            });
                        } else {
                            // 释放连接
                            pool.release(client);
                        }
                        callback({code: 1, msg: ttl});
                    });
                });
            });
        });
    });
}


// 检查用户是否超过捡瓶次数限制
function checkPickTimes(owner, callback) {
    pool.acquire(function (err, client) {
        if (err) {
            return callback({code: 0, msg: err});
        }
        // 到 3 号数据库检查用户是否超过捡瓶次数限制
        client.SELECT(3, function() {
            // 获取该用户捡瓶次数
            client.GET(owner, function (err, result) {
                if (result >= 10) {
                    return callback({code: 0, msg: "今天捡瓶子的机会已经用完啦~"});
                }
                // 捡瓶次数加 1
                client.INCR(owner, function() {
                    // 检查是否是当天第一次捡瓶子
                    // 若是，则设置记录该用户捡瓶次数键的生存期为 1 天
                    // 若不是，生存期保持不变
                    client.TTL(owner, function (err, ttl) {
                        if (ttl === -1) {
                            client.EXPIRE(owner, 86400, function () {
                                // 释放连接
                                pool.release(client);
                            });
                        } else {
                            // 释放连接
                            pool.release(client);
                        }
                        callback({code: 1, msg: ttl});
                    });
                });
            });
        });
    });
}






