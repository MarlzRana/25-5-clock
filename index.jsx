//Adding accurate_interval.js as an alternative to setInterval for a more accurate timer
window.accurateInterval = function (fn, time) {
  var cancel, nextAt, timeout, wrapper;
  nextAt = new Date().getTime() + time;
  timeout = null;
  wrapper = function () {
    nextAt += time;
    timeout = setTimeout(wrapper, nextAt - new Date().getTime());
    return fn();
  };
  cancel = function () {
    return clearTimeout(timeout);
  };
  timeout = setTimeout(wrapper, nextAt - new Date().getTime());
  return {
    cancel: cancel,
  };
};
//Redux actions
const STARTPAUSETIMER = "STARTPAUSETIMER";
const DECREMENTTIMER = "DECREMENTTIMER";
const SWITCHMODE = "SWITCHMODE";
const RESETTIMER = "RESETTIMER";

const DECREMENTBREAKLENGTH = "DECREMENTBREAKLENGTH";
const DECREMENTSESSIONLENGTH = "DECREMENTSESSIONLENGTH";
const INCREMENTBREAKLENGTH = "INCREMENTBREAKLENGTH";
const INCREMENTSESSIONLENGTH = "INCREMENTSESSIONLENGTH";

//Redux action creators
const createActionStartPauseTimer = () => ({
  type: STARTPAUSETIMER,
});
const createActionDecrementTimer = () => ({
  type: DECREMENTTIMER,
});
const createActionSwitchModeTimer = () => ({
  type: SWITCHMODE,
});

const createActionDecrementBreakLength = () => ({
  type: DECREMENTBREAKLENGTH,
});
const createActionDecrementSessionLength = () => ({
  type: DECREMENTSESSIONLENGTH,
});

const createActionIncrementBreakLength = () => ({
  type: INCREMENTBREAKLENGTH,
});
const createActionIncrementSessionLength = () => ({
  type: INCREMENTSESSIONLENGTH,
});

const createActionResetTimer = () => ({
  type: RESETTIMER,
});

//Redux reducers
const timerReducer = (
  prevState = {
    mode: "session",
    value: "25:00",
    breakLength: 5,
    sessionLength: 25,
    repeatingFunction: null,
  },
  sentAction
) => {
  switch (sentAction.type) {
    case STARTPAUSETIMER:
      if (prevState.repeatingFunction) {
        prevState.repeatingFunction.cancel();
        return { ...prevState, repeatingFunction: null };
      } else {
        const repeatingFunction = accurateInterval(() => {
          if (store.getState().timer.value == "00:00") {
            store.dispatch(createActionSwitchModeTimer());
          } else {
            store.dispatch(createActionDecrementTimer());
          }
        }, 1000);
        return { ...prevState, repeatingFunction: repeatingFunction };
      }
    case DECREMENTTIMER:
      const decrementedValue = decrementMMSS(prevState.value);
      return { ...prevState, value: decrementedValue };
    case SWITCHMODE:
      if (prevState.mode == "session") {
        return {
          ...prevState,
          mode: "break",
          value: numericalMMSSToString(prevState.breakLength, 0),
        };
      }
      if (prevState.mode == "break") {
        return {
          ...prevState,
          mode: "session",
          value: numericalMMSSToString(prevState.breakLength, 0),
        };
      }
    case DECREMENTBREAKLENGTH:
      const decrementedBreakLength = prevState.breakLength - 1;
      if (decrementedBreakLength < 1) {
        return prevState;
      }
      if (!prevState.repeatingFunction) {
        if (prevState.mode == "break") {
          return {
            ...prevState,
            value: numericalMMSSToString(decrementedBreakLength, 0),
            breakLength: decrementedBreakLength,
          };
        }
        return { ...prevState, breakLength: decrementedBreakLength };
      }
      return prevState;
    case DECREMENTSESSIONLENGTH:
      const decrementedSessionLength = prevState.sessionLength - 1;
      if (decrementedSessionLength < 1) {
        return prevState;
      }
      if (!prevState.repeatingFunction) {
        if (prevState.mode == "session") {
          return {
            ...prevState,
            value: numericalMMSSToString(decrementedSessionLength, 0),
            sessionLength: decrementedSessionLength,
          };
        }
        return { ...prevState, sessionLength: decrementedSessionLength };
      }
      return prevState;
    case INCREMENTBREAKLENGTH:
      const incrementedBreakLength = prevState.breakLength + 1;
      if (incrementedBreakLength > 60) {
        return prevState;
      }
      if (!prevState.repeatingFunction) {
        if (prevState.mode == "break") {
          return {
            ...prevState,
            value: numericalMMSSToString(incrementedBreakLength, 0),
            breakLength: incrementedBreakLength,
          };
        }
        return { ...prevState, breakLength: incrementedBreakLength };
      }
      return prevState;
    case INCREMENTSESSIONLENGTH:
      const incrementedSessionLength = prevState.sessionLength + 1;
      if (incrementedSessionLength > 60) {
        return prevState;
      }
      if (!prevState.repeatingFunction) {
        if (prevState.mode == "session") {
          return {
            ...prevState,
            value: numericalMMSSToString(incrementedSessionLength, 0),
            sessionLength: incrementedSessionLength,
          };
        }
        return { ...prevState, sessionLength: incrementedSessionLength };
      }
      return prevState;
    case RESETTIMER:
      if (prevState.repeatingFunction) {
        prevState.repeatingFunction.cancel();
      }
      return {
        mode: "session",
        value: "25:00",
        breakLength: 5,
        sessionLength: 25,
        repeatingFunction: null,
      };
    default:
      return prevState;
  }
};

const decrementMMSS = (mmss) => {
  const mmssSplit = mmss.split(":");
  const minutes = Number(mmssSplit[0]);
  const seconds = Number(mmssSplit[1]);
  //If we are at 00:00 do not decrement as we cannot have negative time as it is a scalar quantity
  if (minutes == 0 && seconds == 0) {
    return "00:00";
  }
  //Handles the transition to the next minute
  if (minutes >= 1 && seconds == 0) {
    return numericalMMSSToString(minutes - 1, 59);
  }
  // If there is no need to transition minutes just subtract from the seconds
  return numericalMMSSToString(minutes, seconds - 1);
};

const numericalMMSSToString = (minutes, seconds) => {
  //This is to account for the "lost extra 0" at the front of a mm:ss when converting to Number ensuring all mm:ss are in that format and not for example in m:ss format
  if (minutes < 10 && seconds < 10) {
    return "0" + minutes.toString() + ":" + "0" + seconds.toString();
  } else if (minutes < 10) {
    return "0" + minutes.toString() + ":" + seconds.toString();
  } else if (seconds < 10) {
    return minutes.toString() + ":" + "0" + seconds.toString();
  } else {
    return minutes.toString() + ":" + seconds.toString();
  }
};

//Redux store setup
const rootReducer = Redux.combineReducers({
  timer: timerReducer,
});
const store = Redux.createStore(rootReducer);
console.log(store.getState());

//Importing the necessary components/functions from react-redux
const Provider = ReactRedux.Provider;
const connect = ReactRedux.connect;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.referenceToAudioTag = React.createRef();
    this.playBeep = this.playBeep.bind(this);
    this.resetBeep = this.resetBeep.bind(this);
  }

  playBeep() {
    this.referenceToAudioTag.current.play();
  }

  resetBeep() {
    this.referenceToAudioTag.current.pause();
    this.referenceToAudioTag.current.currentTime = 0;
  }

  render() {
    return (
      <Provider store={store}>
        <div class="clock">
          <Title />
          <ConnectedDialContainer />
          <ConnectedTimer
            value="25:00"
            playBeep={this.playBeep}
            resetBeep={this.resetBeep}
          />
        </div>
        <audio
          id="beep"
          preload="auto"
          ref={this.referenceToAudioTag}
          src="https://raw.githubusercontent.com/freeCodeCamp/cdn/master/build/testable-projects-fcc/audio/BeepSound.wav"
        />
      </Provider>
    );
  }
}

class Title extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id="title">
        <h1>25 + 5 Clock</h1>
      </div>
    );
  }
}

class DialControls extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="dial-controls">
        <button
          id={this.props.title.toLowerCase() + "-decrement"}
          onClick={this.props.decrementFunc}
        >
          <i className="fa-solid fa-arrow-down"></i>
        </button>
        <p id={this.props.title.toLowerCase() + "-length"}>
          {this.props.value}
        </p>
        <button
          id={this.props.title.toLowerCase() + "-increment"}
          onClick={this.props.incrementFunc}
        >
          <i className="fa-solid fa-arrow-up"></i>
        </button>
      </div>
    );
  }
}
class Dial extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="dial">
        <div className="dial-title">
          <h3 id={this.props.title.toLowerCase() + "-label"}>
            {this.props.title} Length
          </h3>
        </div>
        <DialControls
          title={this.props.title}
          value={this.props.value}
          decrementFunc={this.props.decrementFunc}
          incrementFunc={this.props.incrementFunc}
        />
      </div>
    );
  }
}

class DialContainer extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="dial-container">
        <Dial
          title="Break"
          value={this.props.rBreakLength}
          decrementFunc={this.props.rDecrementBreakLength}
          incrementFunc={this.props.rIncrementBreakLength}
        />
        <Dial
          title="Session"
          value={this.props.rSessionLength}
          decrementFunc={this.props.rDecrementSessionLength}
          incrementFunc={this.props.rIncrementSessionLength}
        />
      </div>
    );
  }
}
const mapStateToPropsDialContainer = (storeState) => ({
  rBreakLength: storeState.timer.breakLength,
  rSessionLength: storeState.timer.sessionLength,
});
const mapDispatchToPropsDialContainer = (storeDispatch) => ({
  rDecrementBreakLength: () =>
    storeDispatch(createActionDecrementBreakLength()),
  rDecrementSessionLength: () =>
    storeDispatch(createActionDecrementSessionLength()),
  rIncrementBreakLength: () =>
    storeDispatch(createActionIncrementBreakLength()),
  rIncrementSessionLength: () =>
    storeDispatch(createActionIncrementSessionLength()),
});
const ConnectedDialContainer = connect(
  mapStateToPropsDialContainer,
  mapDispatchToPropsDialContainer
)(DialContainer);

class TimerControls extends React.Component {
  constructor(props) {
    super(props);
    this.resetTimer = this.resetTimer.bind(this);
  }

  resetTimer() {
    this.props.rResetTimer();
    this.props.resetBeep();
  }

  render() {
    return (
      <div className="timer-controls">
        <button id="start_stop" onClick={this.props.rStartPauseCountdown}>
          <i class="fa-solid fa-play"></i>
          <i class="fa-solid fa-pause"></i>
        </button>
        <button id="reset" onClick={this.resetTimer}>
          <i class="fa-solid fa-repeat"></i>
        </button>
      </div>
    );
  }
}

const mapDispatchToPropsTimerControls = (storeDispatch) => ({
  rStartPauseCountdown: () => storeDispatch(createActionStartPauseTimer()),
  rResetTimer: () => storeDispatch(createActionResetTimer()),
});

const ConnectedTimerControls = connect(
  null,
  mapDispatchToPropsTimerControls
)(TimerControls);

class Timer extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (this.props.rTimerValue == "00:00") {
      this.props.playBeep();
    }
    return (
      <div className="timer">
        <div className="timer-display">
          <h2 id="timer-label">
            {this.props.rTimerMode[0].toUpperCase() +
              this.props.rTimerMode.substring(1, this.props.rTimerMode.length)}
          </h2>
          <p id="time-left">{this.props.rTimerValue}</p>
        </div>
        <ConnectedTimerControls resetBeep={this.props.resetBeep} />
      </div>
    );
  }
}

const mapStateToPropsTimer = (state) => ({
  rTimerMode: state.timer.mode,
  rTimerValue: state.timer.value,
});

const ConnectedTimer = connect(mapStateToPropsTimer, null)(Timer);

ReactDOM.render(<App />, document.getElementById("app"));
