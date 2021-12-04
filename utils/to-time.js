module.exports = function msToTime(ms) {
  const seconds = (ms / 1000).toFixed(2);
  const minutes = (ms / (1000 * 60)).toFixed(2);
  const hours = (ms / (1000 * 60 * 60)).toFixed(2);
  const days = (ms / (1000 * 60 * 60 * 24)).toFixed(2);

  if (seconds < 60) {
    return `${seconds} Sec`;
  }

  if (minutes < 60) {
    return `${minutes} Min`;
  }

  if (hours < 24) {
    return `${hours} Hrs`;
  }

  return `${days} Days`;
};
