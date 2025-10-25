# SETUP DIRECTORY

## backend
```

```

## blockchain
```
blockchain/
│   ├── contracts/
|   |   └── Lock.sol
|   ├── ignition/
|   |   └── modules/
|   |       └── Lock.js
│   ├── scripts/
|   |   └── deploy.js
│   ├── test/
|   |   └── Lock.js
|   ├── .env
|   ├── .gitignore
|   ├── hadrhat.config.js
│   └── package.json
```

## frontend
```

```

## middleware
```
middleware/
│   ├── handler/
│   |   ├── mqttHandler.js
│   |   └── blockchainHandler.js
│   ├── .env
|   ├── .gitignore
│   ├── index.js
│   └── package.json
```
## mqtt
```
mqtt/
│   ├── publisher/
│   |   └── sensorPublisher.js
│   ├── .env
|   ├── .gitignore
│   └── package.json
```

## proof
```
proof/
│   ├── compareLedger.js
│   ├── inspectBlock.js
│   └── proof
```

## vm-network
```
vm-network/
│   ├── vm-A/
│   |   └── gethData/
|   |       └── static-nodes.json
│   ├── vm-B/
│   |   └── gethData/
|   |       └── static-nodes.json
|   ├── docker-compose.yml
│   └── genesis.json
```