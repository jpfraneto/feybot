export const FeyAbi = [
  {
    "type": "event",
    "name": "TokenCreated",
    "inputs": [
      {
        "name": "msgSender",
        "type": "address",
        "indexed": true
      },
      {
        "name": "tokenAddress",
        "type": "address",
        "indexed": true
      },
      {
        "name": "tokenAdmin",
        "type": "address",
        "indexed": false
      },
      {
        "name": "tokenMetadata",
        "type": "string",
        "indexed": false
      },
      {
        "name": "tokenImage",
        "type": "string",
        "indexed": false
      },
      {
        "name": "tokenName",
        "type": "string",
        "indexed": false
      },
      {
        "name": "tokenSymbol",
        "type": "string",
        "indexed": false
      },
      {
        "name": "tokenContext",
        "type": "string",
        "indexed": false
      },
      {
        "name": "poolHook",
        "type": "address",
        "indexed": false
      },
      {
        "name": "poolId",
        "type": "bytes32",
        "indexed": false
      },
      {
        "name": "startingTick",
        "type": "int24",
        "indexed": false
      },
      {
        "name": "pairedToken",
        "type": "address",
        "indexed": false
      },
      {
        "name": "locker",
        "type": "address",
        "indexed": false
      },
      {
        "name": "mevModule",
        "type": "address",
        "indexed": false
      },
      {
        "name": "extensionsSupply",
        "type": "uint256",
        "indexed": false
      },
      {
        "name": "extensions",
        "type": "address[]",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "name": "ExtensionTriggered",
    "inputs": [
      {
        "name": "extension",
        "type": "address",
        "indexed": true
      },
      {
        "name": "extensionSupply",
        "type": "uint256",
        "indexed": false
      },
      {
        "name": "msgValue",
        "type": "uint256",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "name": "ClaimFees",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "indexed": true
      },
      {
        "name": "recipient",
        "type": "address",
        "indexed": true
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "name": "SetHook",
    "inputs": [
      {
        "name": "hook",
        "type": "address",
        "indexed": true
      },
      {
        "name": "enabled",
        "type": "bool",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "name": "SetLocker",
    "inputs": [
      {
        "name": "locker",
        "type": "address",
        "indexed": true
      },
      {
        "name": "hook",
        "type": "address",
        "indexed": true
      },
      {
        "name": "enabled",
        "type": "bool",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "name": "SetExtension",
    "inputs": [
      {
        "name": "extension",
        "type": "address",
        "indexed": true
      },
      {
        "name": "enabled",
        "type": "bool",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "name": "SetMevModule",
    "inputs": [
      {
        "name": "mevModule",
        "type": "address",
        "indexed": true
      },
      {
        "name": "enabled",
        "type": "bool",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "name": "SetBaseToken",
    "inputs": [
      {
        "name": "oldBaseToken",
        "type": "address",
        "indexed": true
      },
      {
        "name": "newBaseToken",
        "type": "address",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "name": "SetBootstrap",
    "inputs": [
      {
        "name": "bootstrap",
        "type": "address",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "name": "SetTeamFeeRecipient",
    "inputs": [
      {
        "name": "oldTeamFeeRecipient",
        "type": "address",
        "indexed": true
      },
      {
        "name": "newTeamFeeRecipient",
        "type": "address",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "name": "SetFeeLocker",
    "inputs": [
      {
        "name": "oldFeeLocker",
        "type": "address",
        "indexed": true
      },
      {
        "name": "newFeeLocker",
        "type": "address",
        "indexed": true
      }
    ]
  },
  {
    "type": "event",
    "name": "SetDeprecated",
    "inputs": [
      {
        "name": "deprecated",
        "type": "bool",
        "indexed": false
      }
    ]
  },
  {
    "type": "event",
    "name": "SetTeamFeeRecipientFrozen",
    "inputs": []
  },
  {
    "type": "event",
    "name": "SetFeeLockerFrozen",
    "inputs": []
  }
] as const;