/**
 * Created by ice on 2018/2/13.
 */
var game = new Phaser.Game(240, 400, Phaser.CANVAS, 'game');

// Manage states by game.MyStates.
game.MyStates = {};

// game score.
game.score = 0;

// Boot state, 一般是对游戏进行一些设置(scaleMode..)
game.MyStates.boot = {
    preload: function() {
        game.load.image('preload', 'assets/preloader.gif');
        // 适配模式
        // SHOW_ALL: 长宽比固定
        // game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        if (!game.device.desktop) {
            game.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
        }
    },
    create: function() {
        // 浏览器tab失去焦点时，游戏继续运行
        game.stage.disableVisibilityChange = true;
        game.state.start('load');
    }

};

// Load state, 加载资源
game.MyStates.load = {
    preload: function () {
        // Add progress bar sprite.
        var preloadSprite = game.add.sprite(game.width / 2 - 110, game.height / 2 - 19 / 2, 'preload');

        // Progress bar sprite links with game load progress.
        game.load.setPreloadSprite(preloadSprite);

        game.load.image('background', 'assets/bg.jpg');
        game.load.image('copyright', 'assets/copyright.png');
        game.load.spritesheet('myplane', 'assets/myplane.png', 40, 40, 4);
        game.load.spritesheet('startbutton', 'assets/startbutton.png', 100, 40, 2);
        game.load.spritesheet('replaybutton', 'assets/replaybutton.png', 80, 30, 2);
        game.load.spritesheet('sharebutton', 'assets/sharebutton.png', 80, 30, 2);
        game.load.image('mybullet', 'assets/mybullet.png');
        game.load.image('bullet', 'assets/bullet.png');
        game.load.image('enemy1', 'assets/enemy1.png');
        game.load.image('enemy2', 'assets/enemy2.png');
        game.load.image('enemy3', 'assets/enemy3.png');
        game.load.spritesheet('explode1', 'assets/explode1.png', 20, 20, 3);
        game.load.spritesheet('explode2', 'assets/explode2.png', 30, 30, 3);
        game.load.spritesheet('explode3', 'assets/explode3.png', 50, 50, 3);
        game.load.spritesheet('myexplode', 'assets/myexplode.png', 40, 40, 3);
        game.load.image('award', 'assets/award.png');

        // TODO 客户端浏览器声音格式可能不支持，正式需要提供三种格式(mp3,ogg,wav)
        game.load.audio('normalback', 'assets/normalback.mp3');
        game.load.audio('playback', 'assets/playback.mp3');
        game.load.audio('fashe', 'assets/fashe.mp3');
        game.load.audio('crash1', 'assets/crash1.mp3');
        game.load.audio('crash2', 'assets/crash2.mp3');
        game.load.audio('crash3', 'assets/crash3.mp3');
        game.load.audio('ao', 'assets/ao.mp3');
        game.load.audio('pi', 'assets/pi.mp3');
        game.load.audio('deng', 'assets/deng.mp3');

        // Load progress.
        // add to add a callback fun.
        game.load.onFileComplete.add(function(progress) {
            console.log(progress);
        });

    },
    create: function () {
        // Switch to start state.
        game.state.start('start');
    }
};

// Start state, 游戏开始界面
game.MyStates.start = {
    create: function () {
        game.add.image(0, 0, 'background');
        game.add.image(12, game.height - 16, 'copyright');
        var myplane = game.add.sprite(100, 100, 'myplane');
        myplane.animations.add('fly');
        // 12 to frameRate, true to loop
        myplane.animations.play('fly', 12, true);
        game.add.button(70, 200, 'startbutton', this.onStartClick, this, 1, 1, 0);

        // 声音需要被加载和解码，在移动端可能不能及时播放
        // audio. normalback to resource key, 0.2 to volume, true to loop.
        this.normalback = game.add.audio('normalback', 0.1, true);
        try { // 声音播放有问题继续执行，不要影响游戏
            this.normalback.play();
        } catch (e){}

    },
    onStartClick: function() {
        this.normalback.stop();
        game.state.start('play');
    }
};

// Play state, 游戏主界面
game.MyStates.play = {
    create: function () {
        // 开启ARCADE物理引擎
        game.physics.startSystem(Phaser.Physics.ARCADE);

        var bg = game.add.tileSprite(0, 0, game.width, game.height, 'background');
        bg.autoScroll(0, 20); // 背景滚动

        // 我方飞机(通过使用this将myplane传递到回调函数中)
        this.myplane = game.add.sprite(100, 100, 'myplane');
        this.myplane.animations.add('fly');
        this.myplane.animations.play('fly', 20, true);
        // Avoid dragging the plane beyond the game world
        game.physics.arcade.enable(this.myplane);
        this.myplane.body.collideWorldBounds = true;

        // Enemy
        // this.enemy = game.add.sprite(100, 10, 'enemy1');
        // game.physics.arcade.enable(this.enemy);

        // Make plane to bottom.
        var tween = game.add.tween(this.myplane).to({y: game.height - 50}, 1000, Phaser.Easing.Linear.None, true);
        // Add a callback fun.
        tween.onComplete.add(this.onStart, this);

        // 声音
        // 背景音乐
        this.playback = game.add.audio('playback', 0.2, true);
        try {
            this.playback.play();
        } catch (e) {}
        // 开火音乐
        this.pi = game.add.audio('pi', 1, false);
        // 打中敌人
        this.firesound = game.add.audio('fashe', 5, false);
        // 爆炸音乐
        this.crash1 = game.add.audio('crash1', 10, false);
        this.crash2 = game.add.audio('crash3', 10, false);
        this.crash3 = game.add.audio('crash3', 20, false);
        // 挂了声音
        this.ao = game.add.audio('ao', 10, false);
        // 获得奖牌声音
        this.deng = game.add.audio('deng', 10, false);


    },
    update: function() {
        if (this.myplane.myStartFire) {
            this.myPlaneFire();
            this.generateEnemy();
            this.enemyFire();

            // 我方子弹和敌机进行碰撞检测
            game.physics.arcade.overlap(this.myBullets, this.enemys, this.hitEnemy, null, this);
            // 敌方子弹与我方飞机进行碰撞检测
            game.physics.arcade.overlap(this.enemyBullets, this.myplane, this.hitPlane, null, this);
            // 我方飞机与奖牌进行碰撞检测
            game.physics.arcade.overlap(this.awards, this.myplane, this.getAward, null, this);
            // 我方飞机与敌方飞机的碰撞检测
            game.physics.arcade.overlap(this.enemys, this.myplane, this.crashEnemy, null, this);

        }
    },
    crashEnemy: function(myplane, enemy) { // 我方飞机撞上敌机
        myplane.kill();
        var explode = game.add.sprite(myplane.x, myplane.y, 'myexplode');
        var animation = explode.animations.add('explode');
        animation.play(30, false, false);
        animation.onComplete.addOnce(function() {
            explode.destroy();
            game.state.start('over');
        });
        // TODO 封装函数
        try {
            this.ao.play();
        } catch (e) {}
    },
    getAward: function(myplane, award) {
        award.kill();
        if (myplane.life < 3) {
            myplane.life++;
        }
        try {
            this.deng.play();
        } catch (e) {}

    },
    hitEnemy: function(bullet, enemy) { // 每次注册参数的顺序问题，可以console.log(arguments)
        enemy.life--;
        if (enemy.life <= 0) {
            //debugger;
            enemy.kill();

            // TODO explode应该通过池管理
            // explode effect.
            var explode = game.add.sprite(enemy.x, enemy.y, 'explode' + enemy.index);
            explode.anchor.setTo(0.5, 0.5);
            var animation = explode.animations.add('explode');
            // 30 to frameRate（30 stands 1s play times）, false to do not loop.
            // false to do not kill and util explode destroy, if explode not to, must set to true.
            animation.play(30, false, false);
            // 不添加回调的话，由于异步机制，将先destroy, 动画不能播放。
            animation.onComplete.addOnce(function () {
                // to make stop when code runs here and enter into debug.
                // debugger;
                explode.destroy(); // clean memory

                // deal score.
                //debugger; 匿名函数被回调，需要将this上下文传入才能获取‘play’的上下文
                game.score = game.score + enemy.score;
                this.text.text = 'Score: ' + game.score;
            }, this);
            try {
                // js特性，此时点操作符无法添加变量
                this['crash' + enemy.index].play();
            } catch (e) {}

        }
        bullet.kill(); // kill仅仅是isAlive=false,而不是清理内存
        try {
            this.firesound.play();
        } catch (e) {}
    },
    hitPlane: function(myplane, bullet) { // 我方飞机被击中
        bullet.kill();

        // life-- and judge condition.
        if (--myplane.life <= 0) {
            myplane.kill();

            // explode
            var explode = game.add.sprite(myplane.x, myplane.y, 'myexplode');
            var animation = explode.animations.add('explode');
            animation.play(30, false, false);
            animation.onComplete.addOnce(function() {
                explode.destroy();
                this.playback.stop();
                game.state.start('over');
            }, this);
            try {
                this.ao.play();
            } catch (e) {}
        }
    },
    onStart: function() {
        // 允许拖拽, 启动输入系统
        this.myplane.inputEnabled = true;
        // 第一个参数true代表拖拽的时候鼠标位于精灵中心
        this.myplane.input.enableDrag();
        // Flag.
        this.myplane.myStartFire = true;
        this.myplane.life = 2; // 我方生命值
        this.myplane.lastBulletTime = 0; // 上次发射子弹时间
        // 我方子弹组
        this.myBullets = game.add.group();
        // 敌方子弹组
        this.enemyBullets = game.add.group();
        // 敌方飞机组
        this.enemys = game.add.group();
        this.enemys.lastEnemyTime = 0;

        // Score text.
        var scoreStyle = {font: "16px Arial", fill: "#ff0000"};
        this.text = game.add.text(0, 0, 'Score: 0', scoreStyle);

        this.awards = game.add.group(); // 奖牌组
        // phaser定时器，奖牌每隔30秒产生一次
        game.time.events.loop(Phaser.Timer.SECOND * 3, this.generateAward, this);
    },
    generateAward: function() {
        var awardSize = game.cache.getImage('award');
        var x = game.rnd.integerInRange(0, game.width - awardSize.width);
        var y = -awardSize.height;
        var award = this.awards.getFirstExists(false, true, x, y, 'award');
        award.outOfBoundsKill = true;
        award.checkWorldBounds = true;
        game.physics.arcade.enable(award);
        award.body.velocity.y = 600;
        console.log(this.awards.length);
    },
    myPlaneFire: function() {
        var getMyPlaneBullet = function () {
            // var myBullet = game.add.sprite(this.myplane.x + 15, this.myplane.y - 10 , 'mybullet');
            // get from the bullets. false to the bullet out of the bound.
            // 通过group管理子弹是否exist, 不存在则继续new, 直到子弹数量够游戏使用则不再new。
            var myBullet = this.myBullets.getFirstExists(false);

            if (myBullet) { // have bullet.
                // reset location.
                myBullet.reset(this.myplane.x + 15, this.myplane.y - 10);
            } else { // no bullet.
                myBullet = game.add.sprite(this.myplane.x + 15, this.myplane.y - 10 , 'mybullet');
                // 使得bullet得以被group管理
                myBullet.outOfBoundsKill = true;
                myBullet.checkWorldBounds = true;
                this.myBullets.addChild(myBullet);
                game.physics.enable(myBullet, Phaser.Physics.ARCADE);// 放在上面导致无法碰撞
            }
            return myBullet;
        };
        var now = new Date().getTime();
        // this.myplane.alive: 当我方飞机kill之后不再发射子弹
        if (this.myplane.alive && now - this.myplane.lastBulletTime > 500) {
            var myBullet = getMyPlaneBullet.call(this);
            myBullet.body.velocity.y = -200;

            if (this.myplane.life >= 2) {
                myBullet = getMyPlaneBullet.call(this);
                myBullet.body.velocity.y = -200;
                myBullet.body.velocity.x = 20;
                myBullet = getMyPlaneBullet.call(this);
                myBullet.body.velocity.y = -200;
                myBullet.body.velocity.x = -20;
            }
            if (this.myplane.life >= 3) {
                myBullet = getMyPlaneBullet.call(this);
                myBullet.body.velocity.y = -200;
                myBullet.body.velocity.x = 40;
                myBullet = getMyPlaneBullet.call(this);
                myBullet.body.velocity.y = -200;
                myBullet.body.velocity.x = -40;
            }
            this.myplane.lastBulletTime = now;
            try {
                this.pi.play();
            } catch (e) {}
        }
    },
    generateEnemy: function () {
        var now = game.time.now;
        if (now - this.enemys.lastEnemyTime > 3000) {
            var enemyIndex = game.rnd.integerInRange(1, 3);
            var key = 'enemy' + enemyIndex;
            var size = game.cache.getImage(key).width;
            var x = game.rnd.integerInRange(size/2, game.width - size/2);
            var y = 0;
            // false to outOfBounds, true to generate if null.
            var enemy = this.enemys.getFirstExists(false, true, x, y, key);

            // Setting than anchor to 0.5,0.5 means the textures origin is centered.
            enemy.anchor.setTo(0.5, 0.5);
            enemy.outOfBoundsKill = true;
            enemy.checkWorldBounds = true;
            game.physics.arcade.enable(enemy);
            enemy.body.setSize(size, size);
            enemy.body.velocity.y = 20;
            enemy.lastFireTime = 0;
            enemy.size = size;
            enemy.index = enemyIndex;

            // custom
            if (enemyIndex == 1) {
                enemy.bulletV = 40; // 子弹速度
                enemy.bulletTime = 6000; // 子弹发射间隔
                enemy.life = 2; // 敌机生命值
                enemy.score = 20; // 飞机分值
            } else if (enemyIndex == 2) {
                enemy.bulletV = 80;
                enemy.bulletTime = 4000;
                enemy.life = 3;
                enemy.score = 30;
            } else if (enemyIndex == 3) {
                enemy.bulletV = 120;
                enemy.bulletTime = 2000;
                enemy.life = 5;
                enemy.score = 50;
            }

            this.enemys.lastEnemyTime = now;
        }
    },
    enemyFire: function () {
        var now = game.time.now;
        this.enemys.forEachAlive(function (enemy) {
            if (now - enemy.lastFireTime > enemy.bulletTime) {
                // fire
                var bullet = this.enemyBullets.getFirstExists(false, true, enemy.x, enemy.y + enemy.size/2, 'bullet');
                bullet.anchor.setTo(0.5, 0.5);
                bullet.outOfBoundsKill = true;
                bullet.checkWorldBounds = true;
                game.physics.arcade.enable(bullet);
                bullet.body.velocity.y = enemy.bulletV;

                enemy.lastFireTime = now;
            }
        }, this);

    }

    /*,
    render: function () {
        if (this.enemys) {
            this.enemys.forEachAlive(function (enemy) {
                game.debug.body(enemy);
            });
        }
    }*/
};

// over state, 游戏结束界面
game.MyStates.over = {
    create: function () {
        game.add.image(0, 0, 'background');
        game.add.image(12, game.height - 16, 'copyright');

        var myplane = game.add.sprite(100, 100, 'myplane');
        myplane.animations.add('fly');
        myplane.animations.play('fly', 12, true);

        // code <<boundsAlignH: "center", boundsAlignV: "middle">> and code <<text.setTextBounds(0, 0, game.width, game.height)>> make text center.
        var style = {font: "bold 32px Arial", fill: "#ff0000", boundsAlignH: "center", boundsAlignV: "middle"};
        var text = game.add.text(0,0,'Score: ' + game.score, style);
        text.setTextBounds(0, 0, game.width, game.height);

        // 后面数字表示不同鼠标事件展现的帧
        game.add.button(30, 300, 'replaybutton', this.onRepleyClick, this, 0, 0, 1);
        game.add.button(130, 300, 'sharebutton', this.onShareClick, this, 0, 0, 1);

        this.normalback = game.add.audio('normalback', 0.1, true);
        try { // 声音播放有问题继续执行，不要影响游戏
            this.normalback.play();
        } catch (e){}

    },
    onRepleyClick: function () {
        game.score = 0;
        this.normalback.stop();
        game.state.start('play');
    },
    onShareClick: function () {
        // 展示图片场景由于图片是放置在canvas中，所以长按无法识别二维码
        // 因此只能通过css隐藏一个图片的图层


    }
};

// game关联场景
game.state.add('boot', game.MyStates.boot);
game.state.add('load', game.MyStates.load);
game.state.add('start', game.MyStates.start);
game.state.add('play', game.MyStates.play);
game.state.add('over', game.MyStates.over);

// 进入场景
game.state.start('boot');