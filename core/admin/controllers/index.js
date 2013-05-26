/*global require, module */
(function () {
    "use strict";

    var Ghost = require('../../ghost'),
        _ = require('underscore'),
        fs = require('fs'),
        api = require('../../shared/api'),

        ghost = new Ghost(),
        adminNavbar,
        adminControllers;

     // TODO: combine path/navClass to single "slug(?)" variable with no prefix
    adminNavbar = {
        dashboard: {
            name: 'Dashboard',
            navClass: 'dashboard',
            key: 'admin.navbar.dashboard',
            defaultString: 'dashboard',
            path: ''
        },
        blog: {
            name: 'Content',
            navClass: 'content',
            key: 'admin.navbar.blog',
            defaultString: 'blog',
            path: '/blog'
        },
        add: {
            name: 'New Post',
            navClass: 'editor',
            key: 'admin.navbar.editor',
            defaultString: 'editor',
            path: '/editor'
        },
        settings: {
            name: 'Settings',
            navClass: 'settings',
            key: 'admin.navbar.settings',
            defaultString: 'settings',
            path: '/settings'
        }
    };

    // TODO - make this a util or helper
    function setSelected(list, name) {
        _.each(list, function (item, key) {
            item.selected = key === name;
        });
        return list;
    }

    adminControllers = {
        'login': function (req, res) {
            res.render('login', {
                bodyClass: 'ghost-login',
                hideNavbar: true,
                adminNav: setSelected(adminNavbar, 'login')
            });
        },
        'auth': function (req, res) {
            api.users.check({email: req.body.email, pw: req.body.password}).then(function (user) {
                console.log('user found: ', user);
                req.session.user = "ghostadmin";
                res.redirect(req.query.redirect || '/ghost/');
            }, function(err) {
                // Do something here to signal the reason for an error
                console.log(err.stack);
                res.redirect('/ghost/login/');
            });
        },
        'register': function (req, res) {
            res.render('register', {
                bodyClass: 'ghost-login',
                hideNavbar: true,
                adminNav: setSelected(adminNavbar, 'login')
            });
        },
        'doRegister': function (req, res) {
             // console.log(req.body);
            if (req.body.email_address !== '' && req.body.password.length > 5) {
                api.users.add({
                    email_address: req.body.email_address,
                    password: req.body.password
                }).then(function (user) {
                    console.log('user added', user);
                    res.redirect('/ghost/login/');
                }, function (error) {
                    console.log('there was an error', error);
                });
            } else {
                req.flash('error', "The password is too short. Have at least 6 characters in there");
                res.redirect('back');
            }
        },
        'logout': function (req, res) {
            delete req.session.user;
            req.flash('success', "You were successfully logged out");
            res.redirect('/ghost/login/');
        },
        'index': function (req, res) {
            res.render('dashboard', {
                bodyClass: 'dashboard',
                adminNav: setSelected(adminNavbar, 'dashboard')
            });
        },
        'editor': function (req, res) {
            if (req.params.id !== undefined) {
                api.posts.read({id: parseInt(req.params.id, 10)})
                    .then(function (post) {
                        res.render('editor', {
                            bodyClass: 'editor',
                            adminNav: setSelected(adminNavbar, 'blog'),
                            title: post.get('title'),
                            content: post.get('content')
                        });
                    });
            } else {
                res.render('editor', {
                    bodyClass: 'editor',
                    adminNav: setSelected(adminNavbar, 'add')
                });
            }
        },
        'blog': function (req, res) {
            api.posts.browse()
                .then(function (posts) {
                    res.render('blog', {
                        bodyClass: 'manage',
                        adminNav: setSelected(adminNavbar, 'blog'),
                        posts: posts.toJSON()
                    });
                });
        },
        'settings': function (req, res) {
            api.settings.browse()
                .then(function (settings) {
                    settings = settings.toJSON();
                    settings = _.object(_.pluck(settings, 'key'), _.pluck(settings, 'value'));
                    res.render('settings', {
                        bodyClass: 'settings',
                        adminNav: setSelected(adminNavbar, 'settings'),
                        settings: settings
                    });
                });
        },
        'debug': { /* ugly temporary stuff for managing the app before it's properly finished */
            index: function (req, res) {
                res.render('debug', {
                    bodyClass: 'settings',
                    adminNav: setSelected(adminNavbar, 'settings')
                });
            },
            'dbdelete': function (req, res) {
                fs.writeFile(__dirname + '/../ghost/data/datastore.db', '', function (error) {
                    if (error) {
                        req.flash('error', error);
                    } else {
                        req.flash('success', 'Everything got deleted');
                    }
                    res.redirect('/ghost/debug');
                });
            },
            'dbpopulate': function (req, res) {
                ghost.dataProvider().populateData(function (error) {
                    if (error) {
                        req.flash('error', error);
                    } else {
                        req.flash('success', 'Data populated');
                    }
                    res.redirect('/ghost/debug');
                });
            },
            'newUser': function (req, res) {
                ghost.dataProvider().addNewUser(req, function (error) {
                    if (error) {
                        req.flash('error', error);
                    } else {
                        req.flash('success', 'User Added');
                    }

                });
            }
        }
    };

    module.exports = adminControllers;
}());