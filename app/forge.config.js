import { FuseV1Options, FuseVersion } from "@electron/fuses";

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
        publisher: "CN=SUGIMURA Hiroshi (Kanagawa Institute of Technology)",
        identityName: "HiroshiSUGIMURA.MoekadenRoomJS"
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
        version: FuseVersion.V1,
        resetAdjacentUnusedFuses: true,
        [FuseV1Options.RunAsNode]: false,
        [FuseV1Options.EnableCookieEncryption]: true,
        [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
        [FuseV1Options.EnableNodeCliInspectArguments]: false,
        [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
        [FuseV1Options.OnlyLoadAppFromAsar]: true,
        [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: false
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
