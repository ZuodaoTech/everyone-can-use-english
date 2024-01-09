Download Youtube Video in Golang
==================

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/kkdai/youtube/master/LICENSE)
[![Go Reference](https://pkg.go.dev/badge/github.com/kkdai/youtube.svg)](https://pkg.go.dev/github.com/kkdai/youtube/v2)
[![Build Status](https://github.com/kkdai/youtube/workflows/go/badge.svg?branch=master)](https://github.com/kkdai/youtube/actions)
[![Coverage](https://codecov.io/gh/kkdai/youtube/branch/master/graph/badge.svg)](https://codecov.io/gh/kkdai/youtube)
[![](https://goreportcard.com/badge/github.com/kkdai/youtube)](https://goreportcard.com/badge/github.com/kkdai/youtube)


This package is a Youtube video download package, for more detail refer [https://github.com/ytdl-org/youtube-dl](https://github.com/ytdl-org/youtube-dl) for more download options.

This tool is meant to be used to download CC0 licenced content, we do not support nor recommend using it for illegal activities.

## Overview
  * [Install](#installation)
  * [Usage](#usage)
  * [Example: Download video from \[dotGo 2015 - Rob Pike - Simplicity is Complicated\]](#download-dotGo-2015-rob-pike-video)

## Installation

### Install via go get

Please ensure you have installed Go 1.18 or later.

```shell
go get github.com/kkdai/youtube/v2
```

### From source code

```shell
git clone https://github.com/kkdai/youtube.git
cd youtube
go run ./cmd/youtubedr
```

### Mac

```shell
brew install youtubedr
```

### in Termux
```shell
pkg install youtubedr
```
###  You can also find this package in
- [archlinux](https://aur.archlinux.org/packages/youtubedr/)  (thanks to [cjsthompson](https://github.com/cjsthompson))
- [Termux package](https://github.com/termux/termux-packages/tree/master/packages/youtubedr) (thanks to [kcubeterm](https://github.com/kcubeterm))
- [Homebrew](https://formulae.brew.sh/formula/youtubedr) (thanks to [kkc](https://github.com/kkc))

## Usage

### Use the binary directly
It's really simple to use, just get the video id from youtube url - ex: `https://www.youtube.com/watch?v=rFejpH_tAHM`, the video id is `rFejpH_tAHM`

```shell
$ youtubedr download QAGDGja7kbs
$ youtubedr download https://www.youtube.com/watch?v=rFejpH_tAHM
```


### Use this package in your golang program

Please check out the [example_test.go](example_test.go) for example code.


## Example:
 * ### Get information of dotGo-2015-rob-pike video for downloading

    `go get github.com/kkdai/youtube/v2/youtubedr`

    Download video from [dotGo 2015 - Rob Pike - Simplicity is Complicated](https://www.youtube.com/watch?v=rFejpH_tAHM)

    ```
    youtubedr info https://www.youtube.com/watch?v=rFejpH_tAHM

   Title: dotGo 2015 - Rob Pike - Simplicity is Complicated
   Author: dotconferences
   -----available streams-----
   itag:  18 , quality: medium , type: video/mp4; codecs="avc1.42001E, mp4a.40.2"
   itag:  22 , quality:  hd720 , type: video/mp4; codecs="avc1.64001F, mp4a.40.2"
   itag: 137 , quality: hd1080 , type: video/mp4; codecs="avc1.640028"
   itag: 248 , quality: hd1080 , type: video/webm; codecs="vp9"
   ........
    ```
 * ### Download dotGo-2015-rob-pike-video

    `go get github.com/kkdai/youtube/v2/youtubedr`

    Download video from [dotGo 2015 - Rob Pike - Simplicity is Complicated](https://www.youtube.com/watch?v=rFejpH_tAHM)

    ```
    youtubedr download https://www.youtube.com/watch?v=rFejpH_tAHM
    ```

 * ### Download video to specific folder and name

	`go get github.com/kkdai/youtube/v2/youtubedr`

	Download video from [dotGo 2015 - Rob Pike - Simplicity is Complicated](https://www.youtube.com/watch?v=rFejpH_tAHM) to current directory and name the file to simplicity-is-complicated.mp4

	```
	youtubedr download -d ./ -o simplicity-is-complicated.mp4 https://www.youtube.com/watch?v=rFejpH_tAHM
	```

 * ### Download video with specific quality

	`go get github.com/kkdai/youtube/v2/youtubedr`

	Download video from [dotGo 2015 - Rob Pike - Simplicity is Complicated](https://www.youtube.com/watch?v=rFejpH_tAHM) with specific quality

	```
	youtubedr download -q medium https://www.youtube.com/watch?v=rFejpH_tAHM
	```

   #### Special case by quality hd1080:
   Installation of ffmpeg is necessary for hd1080
   ```
   ffmpeg   //check ffmpeg is installed, if not please download ffmpeg and set to your PATH.
   youtubedr download -q hd1080 https://www.youtube.com/watch?v=rFejpH_tAHM
   ```


 * ### Download video with specific itag

    `go get github.com/kkdai/youtube/v2/youtubedr`

    Download video from [dotGo 2015 - Rob Pike - Simplicity is Complicated](https://www.youtube.com/watch?v=rFejpH_tAHM)

    ```
    youtubedr download -q 18 https://www.youtube.com/watch?v=rFejpH_tAHM
    ```

## How it works

- Parse the video ID you input in URL
	- ex: `https://www.youtube.com/watch?v=rFejpH_tAHM`, the video id is `rFejpH_tAHM`
- Get video information via video id.
	- Use URL: `http://youtube.com/get_video_info?video_id=`
- Parse and decode video information.
	- Download URL in "url="
	- title in "title="
- Download video from URL
	- Need the string combination of "url"

## Inspired
- [https://github.com/ytdl-org/youtube-dl](https://github.com/ytdl-org/youtube-dl)
- [https://github.com/lepidosteus/youtube-dl](https://github.com/lepidosteus/youtube-dl)
- [拆解 Youtube 影片下載位置](http://hkgoldenmra.blogspot.tw/2013/05/youtube.html)
- [iawia002/annie](https://github.com/iawia002/annie)
- [How to get url from obfuscate video info: youtube video downloader with php](https://stackoverflow.com/questions/60607291/youtube-video-downloader-with-php)


## Project52
It is one of my [project 52](https://github.com/kkdai/project52).


## License
This package is licensed under MIT license. See LICENSE for details.
