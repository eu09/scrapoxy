#! /usr/bin/env node

'use strict';

const _ = require('lodash'),
    Promise = require('bluebird'),
    ProviderGCP = require('./providers/gcp'),
    ProviderAWSEC2 = require('./providers/awsec2'),
    ProviderDigitalOcean = require('./providers/digitalocean'),
    ProviderOVHCloud = require('./providers/ovhcloud'),
    ProviderVscale = require('./providers/vscale'),
    moment = require('moment'),
    ovh = require('ovh'),
    path = require('path'),
    program = require('commander'),
    Proxies = require('./proxies'),
    sigstop = require('./common/sigstop'),
    template = require('./template'),
    TestProxy = require('./test-proxy'),
    winston = require('winston');

const configDefaults = require('./config.defaults');

function startProxy(params) {
    if(params.configFilename){
        var configFilename = params.configFilename
        if (!configFilename || configFilename.length <= 0) {
            return winston.error('[Start] Error: Config file not specified');
        }

        configFilename = path.resolve(process.cwd(), configFilename);
        // Load config
        var config;
        try {
            config = _.merge({}, configDefaults, require(configFilename));
        }
        catch (err) {
            return winston.error('[Start] Error: Cannot load config:', err);
        }

    }
    if(params.config){
       // Load config
        var config;
        try {
            config = _.merge({}, configDefaults, params.config);
        }
        catch (err) {
            return winston.error('[Start] Error: Cannot load config:', err);
        } 
    }
    if(!config){
        var config = configDefaults;
    }
    // Write logs (if specified)
    if (config.logs && config.logs.path) {
        winston.add(winston.transports.File, {
            filename: `${config.logs.path}/scrapoxy_${moment().format('YYYYMMDD_HHmmss')}.log`,
            json: false,
            timestamp: true,
        });
    }

    // Initialize
    const providers = getProviders(config);
    if (providers.length <= 0) {
        return winston.error('[Start] Error: Providers are not specified or supported');
    }

    const main = new Proxies(config, providers);

    // Register stop event
    sigstop(
        () => main.shutdown().then(
            () => process.exit(0)
        )
    );


    // Start
    main.listen();
    var scaleConfig = {
        required: config.scaling.required,
        min: config.scaling.min,
        max: config.scaling.max
    }
    console.log("Setting Scaling",scaleConfig)
    main.setScaling(scaleConfig)

    ////////////

    function getProviders(cfg) {
        return _(cfg.providers)
            .map(getProvider)
            .compact()
            .value();


        ////////////

        function getProvider(provider) {
            switch (provider.type) {
                case 'awsec2':
                {
                    return new ProviderAWSEC2(provider, cfg.instance.port);
                }
                
                case 'gcp':
                {
                    return new ProviderGCP(provider, cfg.instance.port);
                }

                case 'digitalocean':
                {
                    return new ProviderDigitalOcean(provider, cfg.instance.port);
                }

                case 'ovhcloud':
                {
                    return new ProviderOVHCloud(provider, cfg.instance.port);
                }

                case 'vscale':
                {
                    return new ProviderVscale(provider, cfg.instance.port);
                }

                default:
                {
                    return;
                }
            }
        }
    }
}



function ovhConsumerKey(endpoint, appKey, appSecret) {
    if (!appKey || appKey.length <= 0 || !appSecret || appSecret.length <= 0) {
        return winston.error('[OVH] Error: appKey or appSecret not specified');
    }

    const client = ovh({
        endpoint,
        appKey,
        appSecret,
    });

    client.request('POST', '/auth/credential', {
        'accessRules': [
            {'method': 'GET', 'path': '/cloud/*'},
            {'method': 'POST', 'path': '/cloud/*'},
            {'method': 'PUT', 'path': '/cloud/*'},
            {'method': 'DELETE', 'path': '/cloud/*'},
        ],
    }, (err, credential) => {
        if (err) {
            return winston.error('[OVH] Error: Cannot get consumerKey:', err);
        }

        winston.info('[OVH] Your consumerKey is:', credential.consumerKey);
        winston.info('[OVH] Please validate your token here:', credential.validationUrl);
    });
}

module.exports = {
    start: (config) => {
        startProxy({...config})
    }
}
