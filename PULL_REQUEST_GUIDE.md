# How to Contribute Back to Original Repository

## 📋 **Step-by-Step Guide for Pull Request**

### **1. 🔍 Identify Original Repository**

The original repository is: `https://github.com/dmy3k/auto-power-profile`

### **2. 🔧 Prepare Your Fork**

```bash
# Add original repository as upstream remote
git remote add upstream https://github.com/dmy3k/auto-power-profile.git

# Fetch latest changes from original
git fetch upstream

# Create a new branch for your contribution
git checkout -b feature/animation-control

# Ensure your branch is up to date
git rebase upstream/main
```

### **3. 📝 Create a Comprehensive Commit**

```bash
# Add all your changes
git add .

# Create descriptive commit message
git commit -m "feat: Add automatic animation control for battery optimization

- Implement automatic GNOME animations disable/enable based on power state
- Add Battery Optimizations preferences section with animation toggle
- Enhance power state detection to include CHARGING states
- Add Portuguese Brazilian (pt_BR) complete translation
- Optimize preferences window size for better UX
- Add installation and build scripts for easier deployment
- Update metadata.json with new feature description

This feature provides significant power savings by automatically disabling
CPU/GPU intensive animations when running on battery power, while
seamlessly restoring them when connected to AC power."
```

### **4. 🚀 Push and Create Pull Request**

```bash
# Push your branch to your fork
git push origin feature/animation-control
```

Then go to GitHub and:

1. **Navigate to your fork**: `https://github.com/andrecesarvieira/auto-power-profile`
2. **Click "Compare & pull request"**
3. **Fill out the PR template**:

### **📋 Pull Request Template**

```markdown
## 🆕 Feature: Automatic Animation Control for Battery Optimization

### **Description**
This PR adds automatic GNOME animation control based on power state, providing significant battery life improvements by automatically disabling CPU/GPU intensive animations when running on battery power.

### **Changes Made**

#### **Core Functionality**
- ✅ **Animation Control Logic**: Automatically disable/enable GNOME animations based on power state
- ✅ **Enhanced Power Detection**: Improved UPower state detection including CHARGING states  
- ✅ **Settings Integration**: New "Battery Optimizations" section in preferences
- ✅ **State Preservation**: Maintains user's original animation preferences

#### **User Experience**
- ✅ **Seamless Operation**: Transparent transitions between power states
- ✅ **Configurable**: Optional feature with toggle in preferences (disabled by default)
- ✅ **Optimized UI**: Better preferences window sizing for improved usability

#### **Localization**
- ✅ **Portuguese Brazilian**: Complete translation for pt_BR locale
- ✅ **Translation System**: Optimized .po/.mo file handling

#### **Development Tools**
- ✅ **Installation Script**: One-line installation for end users
- ✅ **Build System**: Automated compilation scripts
- ✅ **Documentation**: Updated README and changelog

### **Benefits**
- **🔋 Power Savings**: Significant reduction in CPU/GPU usage on battery
- **⚡ Performance**: Smoother experience on battery-powered devices  
- **🎯 User-Friendly**: Automatic operation requiring no user intervention
- **🌍 Accessible**: Full Portuguese localization for broader reach

### **Testing**
- ✅ Tested on GNOME Shell 45, 46, 47, 48
- ✅ Validated power state transitions (AC ↔ Battery)
- ✅ Confirmed animation disable/enable functionality
- ✅ Verified settings preservation across power states
- ✅ Tested installation and build scripts

### **Compatibility**
- ✅ **Backward Compatible**: No breaking changes to existing functionality
- ✅ **Opt-in**: Feature disabled by default, user must enable
- ✅ **Clean Integration**: Follows existing code patterns and conventions
- ✅ **Zero Dependencies**: Uses only native GNOME/GTK APIs

### **Files Changed**
- `extension.js` - Animation control implementation
- `prefs.js` - Enhanced preferences interface  
- `ui/general.ui` - Updated UI with new options
- `metadata.json` - Version and description updates
- `po/pt_BR.po` - Complete Portuguese translation
- `install.sh`, `build.sh` - New utility scripts
- `CHANGELOG.md` - Version history

### **How to Test**
1. Install the extension
2. Enable "Disable animations on battery" in preferences
3. Disconnect AC power - animations should disable
4. Reconnect AC power - animations should restore
5. Verify original settings are preserved

**Ready for review and feedback!** 🚀
```

### **5. 📞 Follow Up**

- **Be responsive** to maintainer feedback
- **Be prepared to make adjustments** based on their coding standards
- **Explain the benefits** clearly in discussions
- **Provide additional testing** if requested

### **6. 🤝 Alternative Approach**

If the maintainer prefers smaller PRs, you could split this into:

1. **PR 1**: Core animation control functionality only
2. **PR 2**: Portuguese translation
3. **PR 3**: UI improvements and build scripts

### **💡 Tips for Success**

- **Follow their coding style** and conventions
- **Keep commits clean** and well-documented  
- **Provide thorough testing** information
- **Be open to feedback** and suggestions
- **Highlight the user benefits** clearly

This systematic approach maximizes the chances of your contributions being accepted! 🎯