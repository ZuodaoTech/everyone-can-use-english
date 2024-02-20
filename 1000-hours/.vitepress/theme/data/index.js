function getAudioPath(word, accent) {
  word = word.toLowerCase();
  accent = accent || 'us';
  const item = mapping[word];
  if (item && item[accent] && item[accent].length !== 0) {
    return `/vendor/audios/${item[accent][0]}`
  }
  return '';
}

export {
  getAudioPath
}