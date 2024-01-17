# Everyone Can Use English

## Table of Contents

- [Introduction](./book/README.md)
- [Chapter 1: Starting Point](./book/chapter1.md)
- [Chapter 2: Spoken Language](./book/chapter2.md)
- [Chapter 3: Pronunciation](./book/chapter3.md)
- [Chapter 4: Reading Aloud](./book/chapter4.md)
- [Chapter 5: Dictionary](./book/chapter5.md)
- [Chapter 6: Grammar](./book/chapter6.md)
- [Chapter 7: Intensive Reading](./book/chapter7.md)
- [Chapter 8: Reminders](./book/chapter8.md)
- [Afterword](./book/end.md)

## Applications

- [Enjoy App](./enjoy/README.md)

## \* Developers

### Local Setup

```bash
yarn install
yarn start:enjoy
```

### Compilation

```bash
yarn make:enjoy
```

## \* Everyday Users

Method 1: The **most direct and simple method** is to download the appropriate installation file from the [releases page](https://github.com/xiaolai/everyone-can-use-english/tags).

Method 2: If you want to **try out updated versions** at any time, follow these steps.

### For MacOS Users

1. Open the Terminal command line tool.
2. Install Homebrew (refer to this article: 《[从 Terminal 开始…](https://github.com/xiaolai/apple-computer-literacy/blob/main/start-from-terminal.md)》）
3. Install `nodejs` and `yarn`:

   ```bash
   brew install nvm
   nvm install 20.5.1 
   brew install yarn
   ```

4. Clone this repository locally and then install and launch:

   ```bash
   cd ~
   mkdir github
   cd github
   git clone https://github.com/xiaolai/everyone-can-use-english
   cd everyone-can-use-english
   yarn install
   yarn start:enjoy
   ```

### For Windows Users

System requirements: Windows 10 version 22H2 or later, [Windows PowerShell 5.1](https://aka.ms/wmf5download) or later, stable internet connection.

1. Right-click on the "Windows logo" in the taskbar and choose "PowerShell".

   > Tips 1: On the latest Windows 11, you may not see the "PowerShell" option, only "Terminal".
   >
   > Tips 2: Do not run PowerShell with administrator privileges, as it may cause Scoop installation failure.

2. In the opened PowerShell window, execute the following commands to install Scoop:

   ```powershell
   # Set PowerShell execution policy
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   # Download installation script
   irm get.scoop.sh -outfile 'install.ps1'
   # Execute installation, --ScoopDir parameter specifies the Scoop installation path
   .\install.ps1 -ScoopDir 'C:\Scoop'
   ````

If you encounter the error:

> `<span style="color:red">`irm :  Could not resolve this remote name:  'raw.githubusercontent.com'

It indicates a **network connection** problem; please resolve it on your own.

3. Install Nodejs and yarn as well as other dependencies:

```powershell
scoop install nodejs
scoop install git
npm install yarn -D
````

4. Clone this repository locally, and then install the Enjoy App:

   ```powershell
   cd ~
   mkdir github
   cd github
   git clone https://github.com/xiaolai/everyone-can-use-english
   cd everyone-can-use-english
   cd enjoy
   yarn install
   yarn start:enjoy
   ```

   If you see `Completed in XXXXXXXXXX` ,it indicates successful installation.

5. Run the Enjoy App by executing the following command in the terminal:

```powershell
yarn start:enjoy
```

## Update Enjoy

Update and use the latest version of Enjoy:

1. Pull the latest content from the repository locally, execute in the command line tool:

   ```bash
   git pull
   ```

   The result should display:

   ```shell
   Already up to date.
   ```

2. Run the Enjoy App:

   ```shell
   yarn start:enjoy
   ```
