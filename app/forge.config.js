export default {
  packagerConfig: {
    name: "MoekadenRoomJS",
    executableName: "MoekadenRoomJS",
    icon: "./src/icons/icon",
    asar: true,
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "MoekadenRoomJS",
        signWithParams: "/fd sha256 /tr http://timestamp.digicert.com /td sha256"
      }
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"]
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        format: "ULFO"
      }
    },
    {
      name: "@electron-forge/maker-deb",
      config: {
        options: {
          maintainer: "SUGIMURA Hiroshi",
          homepage: "https://github.com/Hirosh1912/MoekadenRoomJS"
        }
      }
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {}
    },
    {
      name: "@electron-forge/maker-appx",
      config: {
        identityName: "CN=MoekadenRoomJS"
      }
    }
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {}
    },
    {
      name: "@electron-forge/plugin-fuses",
      config: {
        version: "1.8.0",
        resetAdjacentUnusedFuses: false,
        onlyMakeBinaries: true,
        fuses: [
          "EnableNodeIntegration=false",
          "EnableNodeIntegrationInWorker=false",
          "EnableNodeIntegrationInSubFrames=false",
          "NodeIntegration=false",
          "NodeIntegrationInWorker=false",
          "NodeIntegrationInSubFrames=false",
          "ChildNodeIntegration=false",
          "DisableNodeIntegrationInChildFrames=true",
          "EnablePreload=true",
          "ContextIsolation=true",
          "EnableRemoteModule=false",
          "SandboxRenderer=true"
        ]
      }
    }
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "Hirosh1912",
          name: "MoekadenRoomJS"
        },
        prerelease: false,
        draft: true
      }
    }
  ]
};
