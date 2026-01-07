export default {
  packagerConfig: {
    name: "MoekadenRoomJS",
    executableName: "MoekadenRoomJS",
    icon: "./src/icons/H_pink",
    asar: true,
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "MoekadenRoomJS"
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
