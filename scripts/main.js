(function () {
    var app = {
        initPlugins: {},

        initedPlugins: [],

        addInitPlugins: function (plugins) {
            _.extend(this.initPlugins, plugins);
        },

        _runPlugin: function (plugin, handle) {
            plugin.func.call(function () {}, this, plugin);
            this.initedPlugins.push(handle);
            $(document).trigger('init:plugin:' + handle, handle);
        },

        _checkDeps: function (deps, handle, plugin) {
            deps = _.without(deps, handle);
            if (deps.length == 0) {
                this._runPlugin(plugin, handle);
                return false;
            }
            return deps;
        },
        _initPlugins: function () {
            var o = this;
            _.each(this.initPlugins, function (plugin, handle) {
                var deps = plugin.deps
                if (plugin.deps) {
                    _.each(deps, function (dep) {
                        if (!~_.indexOf(o.initedPlugins, handle)) {
                            deps = o._checkDeps(deps, handle, plugin);
                        } else {
                            $(document).bind('init:plugin:' + dep, function (e, handle_) {
                                deps = o._checkDeps(deps, handle_, plugin);
                            });
                        }
                    });
                } else {
                    o._runPlugin(plugin, handle);
                }
            });
        },

        init: function () {
            var o = this;
            $(document).trigger('init');
            $(function () {
                $(document).trigger('init:domReady');
                o._initPlugins();
            });
            $(document).trigger('init:complete');
        }
    };




    var urlBase = 'lib/handler.php?action=';

    function send(action, params_) {
        var params = {
            error: function (jqXHR, textStatus, err) {
                alert(err);
            }
        };
        if (params_) $.extend(params, params_);

        $.ajax(urlBase + action, params);
    }

    function View(opts) {
        var o = this;
        var DEFAULTS = {
            el: document
        };

        _.extend(this, DEFAULTS, opts);

        this.el = $(this.el);

        _.each(this.events, function (action, handler) {
            var delimiter = handler.lastIndexOf(' '),
                event = handler.slice(delimiter + 1),
                selector = handler.slice(0, delimiter);

            o.el.delegate(selector, event, action);
        });
    }

    var initPlugins = {
        nav: { //导航
            func: function () {
                var params = {
                    success: function (data, textStatus, jqXHR) {
                        alert(jqXHR.responseText);
                    }
                };
                var view = new View({
                    el: '#nav',
                    events: {
                        '.wb-login click': function (e) {
                            e.preventDefault();
                            window.location.href = 'http://weibo.com/' + app.user.domain;
                        },
                        '.wb-followUs click': function (e) {
                            e.preventDefault();
                            send('followUs', params);
                        },
                        '.wb-recommend click': function (e) {
                            e.preventDefault();
                            send('recommend', params);
                        }

                    }
                });
            }
        },
        connect: { //发送到微博
            func: function () {
                $('#connect-btn').click(function () {
                    var content = $('#connect-content').val();
                    if ($.trim(content) === '') {
                        alert('说点什么吧！');
                        return;
                    }

                    send('connect', {
                        data: {
                            content: content
                        },
                        success: function (data, textStatus, jqXHR) {
                            alert(jqXHR.responseText);
                        }
                    });
                });


                $('#connect-content').keyup(function () {
                    if ($(this).val().length > 140) {
                        $(this).val($(this).val().substring(0, 140));
                    }
                });
            }
        },
        question: {
            func: function () {
                var questions = [{
                    q: "你旧时的恋人电话给你，你接不接？",
                    l: [{
                        c: "接",
                        t: 1
                    }, {
                        c: "不接",
                        t: 2
                    }]
                }, {
                    q: "喜欢睡怎样的床？",
                    l: [{
                        c: "单人床",
                        t: 3
                    }, {
                        c: "双人床",
                        t: 2
                    }]
                }, {
                    q: "经常听的歌曲里面会有很多过去的回忆吗？",
                    l: [{
                        c: "Yes",
                        t: 3
                    }, {
                        c: "No",
                        t: 4
                    }]
                }, {
                    q: "你有上闹钟的习惯吗？",
                    l: [{
                        c: "Yes",
                        t: 5
                    }, {
                        c: "No",
                        t: 4
                    }]
                }, {
                    q: "最近一次看电影是怎样的？",
                    l: [{
                        c: "一个人去看的",
                        t: 5
                    }, {
                        c: "有别人陪着去看的",
                        t: 6
                    }]
                }, {
                    q: "手机铃声属于哪个类型",
                    l: [{
                        c: "默认铃声",
                        t: 6
                    }, {
                        c: "自己特别设定的铃声",
                        t: 7
                    }]
                }, {
                    q: "伤心的时候喜欢怎样？",
                    l: [{
                        c: "一个人呆着",
                        t: "A"
                    }, {
                        c: "找人倾诉",
                        t: "B"
                    }]
                }, {
                    q: "如果中奖可以挑选，你会选择以下哪种奖品？",
                    l: [{
                        c: "车",
                        t: "C"
                    }, {
                        c: "房",
                        t: "D"
                    }]
                }];
                var answers = {
                    "A": "假面关键词：热情。不了解你得人常常以为你乐观开朗，热情洋溢，是火红色的一只长毛狐狸。只有天天跟你住在一起的人才会了解到你的忧郁。冷静以及悲观的灵魂，俨然是一只雪白的兔子。那么你这样好静的兔子为什么会披上狐狸的外衣呢？追其究竟，那是你强烈的责任感和与生俱来的善良友好，催化你化身九尾火狐跳跃着，奔跑着，很多时候你甚至会觉得这身火狐狸皮让自己心头燥热",
                    "B": "假面关键词：亲切。你温柔舒缓的气质让人觉得亲切得像认识已久的老朋友，但是，事实上，你是个易接近却难了解的人，你并不喜欢把你自己的人生轻易吐露他人。亲切对你来说很多时候更像是一种心态和礼貌。换句话来说，你往往对陌生人才会施展出你的亲和力，就像是躲在床上装成祖母的老狼，只有你的至交好友才会了解你的古怪和疯狂。",
                    "C": "假面关键词：冷漠。你的不安造就了你的冷漠，其中最大的不按点是你由于对爱的渴望而产生的对爱的恐惧，你害怕别人喜欢上你，你害怕别人对你感兴趣。因此，你往往流露出冷漠而绝望的表情，让人以为你是穷困潦倒的过客，没有灵魂的废墟。而你的朋友甚至只要是跟你夺走近一点的人都会了解你，是其实是个非常浪漫有趣的家伙，心情好起来的时候就像天上璀璨的烟火。",
                    "D": "假面关键词：物质。你是一只很像乌龟的动物，很多很多人都会以为你爱钱，但实际上你比任何人都不在乎它。但物质对你来说又是不能缺少的一张假面，它替你保护了你柔软的同情心，让你能够追逐你的梦想。物质就像是你坚硬的壳，它帮你度过了各种难关。而只有那个对你耐心肯花精力跟你一起的人才明白，打碎你的梦想才会要你的命。"
                }

                var q = $('.question');

                var setAnswer = function (i) {
                        answer = i;
                        setcontent(i);
                        q.addClass('question-done');
                        $('.question-hd', q).html("你是属于" + i + "型");
                        $('.question-bd', q).html(answers[i]);
                        q.fadeIn('slow');
                        $('#connect').slideDown();
                    }

                function setcontent(answer) {
                    var type;
                    switch (answer) {
                    case "A":
                        type = "热情";
                        break;
                    case "B":
                        type = "亲切";
                        break;
                    case "C":
                        type = "冷漠";
                        break;
                    case "D":
                        type = "物质";
                        break;
                    }
                    var c = "你真的了解自己吗？有没有觉得其实自己也很虚伪，有时候正直只是个借口。想不想知道自己最假的一面是什么?做个心理测试吧，帮你认识一下自己最假的一面在哪?。我的假面关键词是" + answer + "型：" + type + "。。。蛮准的哦，推荐试试~~~http://zj.weiboapplab.com";
                    $('#connect-content').val(c);
                }

                var setQuestion = function (i) {
                        if (i == undefined) i = 0;
                        var o = questions[i];

                        $('.question-hd', q).html(o.q);
                        var arr = new Array();
                        for (var i in o.l)
                        arr.push('<li t="' + o.l[i].t + '">' + o.l[i].c + '</li>');
                        $('ul', q).html(arr.join(''));

                        $('li', q).click(function () {
                            var t = $(this).attr('t');
                            var isnum = /[0-9]/;
                            q.fadeOut('slow', function () {
                                isnum.test(t) ? setQuestion(t) : setAnswer(t);
                            });
                        });
                        q.fadeIn('slow');
                    }

                setQuestion();
            }
        }
    };


    app.addInitPlugins(initPlugins);
    app.init();

    window.app = app;
})();