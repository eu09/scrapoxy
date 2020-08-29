# Scrapoxy

This is a fork of Scrapoxy, an abandonned project at https://github.com/fabienvauchelles/scrapoxy

I've done some work to make it more suited to my project, feel free to grab bits.

**Main Changes**

- Requests are now in the format of http(s)://localhost:8888/http://www.domain.com/full-url - this gets around all of the MITM problems that the original project has, this allows all responses to have the instanceName. This library does not enforce a static user-agent per instance.
- Better Authentication: I didn't like defining plaintext passwords in the config, so have changed this to proper bcrypt hashes/checking
- AWS instances are Spot instances instead of On Demand to save money. This will cause problems if you are limiting the instance types or regions you are using.
- Cherry picked unmerged PRs from the original repo - Implement GCP as a provider, Don't crash on startup
- This is not started in CLI, it is included as a regular node module. It does not need to be installed globally - installing as a standard node module in a project is fine. In doing this, I may have prevented OVH from working (as I did not migrate an OVH CLI function to the new structure). Feel free to submit a PR if you fix this.

**Usage**

Module is not quite working correctly, I'm just requiring server/index.js at this stage.

Start server: 
```
var scrapoxy = require("./server/index")
var config = {
    config: {
        proxy: {
            port: 8888,
            auth: {
                hash: '$2b$10$BCRYPT-HASH' // BCRYPT HASH OF PLAINTEXT PASSWORD
            }
        },
        "commander": {
            password_hash: '$2b$10$BCRYPT-HASH' // MUST BE BCRYPT HASH OF BASE64 ENCODED PASSWORD
        },
        "instance": {
            "port": 3128,
            "scaling": {
                "min": 1,
                "max": 1
            },
            autorestart: {
                minDelay: 180000,
                maxDelay: 600000,
            },
            scaling: {
                downscaleDelay: 300000, 
            },
        },
        "providers": [
           
            {
                "type": "awsec2",
                "accessKeyId": "ID",
                "secretAccessKey": "KEY",
                "region": "REGION",
                "instance": {
                    "InstanceType": "t3.nano",
                    "ImageId": "ami-IMAGEID",
                    "SecurityGroups": [
                        "SGID"
                    ]
                }
            }
           
        ]
    }
}

scrapoxy.start(config)
```

**USAGE**

```
GET http://host:port/http://domain.com/path/to/url?inc_query=true
X-Auth-Key: plaintext-proxy.auth.hash
```