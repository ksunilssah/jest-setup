const { configure } = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');

configure({ adapter: new Adapter() });

/* eslint-disable func-names */
window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener() {},
      removeListener() {},
    };
  };

window.requestAnimationFrame =
  window.requestAnimationFrame ||
  function (callback) {
    setTimeout(callback, 0);
  };
/* eslint-enable func-names */

// Mock videojs youtube - required by <VideoPlayer />
/* eslint-disable no-undef */
jest.mock('videojs-youtube/dist/Youtube', () => 'Youtube');
/* eslint-enable no-undef */
