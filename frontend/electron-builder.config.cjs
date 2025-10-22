module.exports = {
  appId: "com.noxbuddy.app",
  productName: "Nox-Buddy",
  directories: {
    output: "build"
  },
  files: [
    "dist/**/*",
    "public/main/preload.cjs",
    "public/main/electron.cjs",
    "package.json"
  ],
  asarUnpack: [
    "dist/**/*"
  ],
  extraResources: [
    {
      from: "../backend/",
      to: "backend",
      filter: ["**/*", "!__pycache__", "!*.pyc", "!venv", "!.env"]
    }
  ],
  mac: {
    category: "public.app-category.productivity",
    target: [
      {
        target: "dmg",
        arch: ["x64", "arm64"]
      }
    ],
    type: "distribution"
  },
  dmg: {
    contents: [
      {
        x: 130,
        y: 220
      },
      {
        x: 410,
        y: 220,
        type: "link",
        path: "/Applications"
      }
    ]
  },
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64", "ia32"]
      }
    ],
    icon: "public/main/icons/icon.ico"
  },
  linux: {
    target: [
      {
        target: "AppImage",
        arch: ["x64"]
      }
    ],
    icon: "public/main/icons"
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true
  },
  npmRebuild: false,
  buildDependenciesFromSource: false,
  afterPack: async (context) => {
    // Skip python checks
    return Promise.resolve();
  }
};
