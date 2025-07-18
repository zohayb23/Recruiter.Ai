import {
  TransitionGroup_default,
  chainPropTypes,
  createSimplePaletteValueFilter,
  elementTypeAcceptingRef_default,
  refType_default,
  useLazyRef,
  useSlot,
  useSlotProps_default,
  useTimeout
} from "./chunk-JDRXWPOV.js";
import {
  capitalize_default,
  createSvgIcon,
  debounce_default,
  memoTheme_default,
  ownerDocument_default,
  ownerWindow_default,
  setRef,
  useControlled,
  useEnhancedEffect_default,
  useEventCallback_default,
  useEventCallback_default2,
  useForkRef_default,
  useId_default
} from "./chunk-IMAT3QDG.js";
import {
  internal_createExtendSxProp,
  useDefaultProps
} from "./chunk-CKWWFWUS.js";
import {
  alpha,
  composeClasses,
  css,
  generateUtilityClass,
  generateUtilityClasses,
  keyframes,
  require_prop_types,
  resolveProps,
  rootShouldForwardProp_default,
  styled_default,
  useId,
  useRtl,
  useTheme
} from "./chunk-T23N53GG.js";
import {
  require_jsx_runtime
} from "./chunk-FT54CQ4H.js";
import {
  clsx_default,
  require_react_is
} from "./chunk-MX3MQ5YK.js";
import {
  require_react
} from "./chunk-TVFQMRVC.js";
import {
  __toESM
} from "./chunk-G3PMV62Z.js";

// node_modules/@mui/material/esm/ButtonBase/touchRippleClasses.js
function getTouchRippleUtilityClass(slot) {
  return generateUtilityClass("MuiTouchRipple", slot);
}
var touchRippleClasses = generateUtilityClasses("MuiTouchRipple", ["root", "ripple", "rippleVisible", "ripplePulsate", "child", "childLeaving", "childPulsate"]);
var touchRippleClasses_default = touchRippleClasses;

// node_modules/@mui/material/esm/ButtonBase/buttonBaseClasses.js
function getButtonBaseUtilityClass(slot) {
  return generateUtilityClass("MuiButtonBase", slot);
}
var buttonBaseClasses = generateUtilityClasses("MuiButtonBase", ["root", "disabled", "focusVisible"]);
var buttonBaseClasses_default = buttonBaseClasses;

// node_modules/@mui/material/esm/ButtonBase/ButtonBase.js
var React4 = __toESM(require_react(), 1);
var import_prop_types3 = __toESM(require_prop_types(), 1);

// node_modules/@mui/utils/esm/isFocusVisible/isFocusVisible.js
function isFocusVisible(element) {
  try {
    return element.matches(":focus-visible");
  } catch (error) {
    if (!/jsdom/.test(window.navigator.userAgent)) {
      console.warn(["MUI: The `:focus-visible` pseudo class is not supported in this browser.", "Some components rely on this feature to work properly."].join("\n"));
    }
  }
  return false;
}

// node_modules/@mui/material/esm/useLazyRipple/useLazyRipple.js
var React = __toESM(require_react(), 1);
var LazyRipple = class _LazyRipple {
  /** React ref to the ripple instance */
  /** If the ripple component should be mounted */
  /** Promise that resolves when the ripple component is mounted */
  /** If the ripple component has been mounted */
  /** React state hook setter */
  static create() {
    return new _LazyRipple();
  }
  static use() {
    const ripple = useLazyRef(_LazyRipple.create).current;
    const [shouldMount, setShouldMount] = React.useState(false);
    ripple.shouldMount = shouldMount;
    ripple.setShouldMount = setShouldMount;
    React.useEffect(ripple.mountEffect, [shouldMount]);
    return ripple;
  }
  constructor() {
    this.ref = {
      current: null
    };
    this.mounted = null;
    this.didMount = false;
    this.shouldMount = false;
    this.setShouldMount = null;
  }
  mount() {
    if (!this.mounted) {
      this.mounted = createControlledPromise();
      this.shouldMount = true;
      this.setShouldMount(this.shouldMount);
    }
    return this.mounted;
  }
  mountEffect = () => {
    if (this.shouldMount && !this.didMount) {
      if (this.ref.current !== null) {
        this.didMount = true;
        this.mounted.resolve();
      }
    }
  };
  /* Ripple API */
  start(...args) {
    this.mount().then(() => this.ref.current?.start(...args));
  }
  stop(...args) {
    this.mount().then(() => this.ref.current?.stop(...args));
  }
  pulsate(...args) {
    this.mount().then(() => this.ref.current?.pulsate(...args));
  }
};
function useLazyRipple() {
  return LazyRipple.use();
}
function createControlledPromise() {
  let resolve;
  let reject;
  const p = new Promise((resolveFn, rejectFn) => {
    resolve = resolveFn;
    reject = rejectFn;
  });
  p.resolve = resolve;
  p.reject = reject;
  return p;
}

// node_modules/@mui/material/esm/ButtonBase/TouchRipple.js
var React3 = __toESM(require_react(), 1);
var import_prop_types2 = __toESM(require_prop_types(), 1);

// node_modules/@mui/material/esm/ButtonBase/Ripple.js
var React2 = __toESM(require_react(), 1);
var import_prop_types = __toESM(require_prop_types(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
function Ripple(props) {
  const {
    className,
    classes,
    pulsate = false,
    rippleX,
    rippleY,
    rippleSize,
    in: inProp,
    onExited,
    timeout
  } = props;
  const [leaving, setLeaving] = React2.useState(false);
  const rippleClassName = clsx_default(className, classes.ripple, classes.rippleVisible, pulsate && classes.ripplePulsate);
  const rippleStyles = {
    width: rippleSize,
    height: rippleSize,
    top: -(rippleSize / 2) + rippleY,
    left: -(rippleSize / 2) + rippleX
  };
  const childClassName = clsx_default(classes.child, leaving && classes.childLeaving, pulsate && classes.childPulsate);
  if (!inProp && !leaving) {
    setLeaving(true);
  }
  React2.useEffect(() => {
    if (!inProp && onExited != null) {
      const timeoutId = setTimeout(onExited, timeout);
      return () => {
        clearTimeout(timeoutId);
      };
    }
    return void 0;
  }, [onExited, inProp, timeout]);
  return (0, import_jsx_runtime.jsx)("span", {
    className: rippleClassName,
    style: rippleStyles,
    children: (0, import_jsx_runtime.jsx)("span", {
      className: childClassName
    })
  });
}
true ? Ripple.propTypes = {
  /**
   * Override or extend the styles applied to the component.
   */
  classes: import_prop_types.default.object.isRequired,
  className: import_prop_types.default.string,
  /**
   * @ignore - injected from TransitionGroup
   */
  in: import_prop_types.default.bool,
  /**
   * @ignore - injected from TransitionGroup
   */
  onExited: import_prop_types.default.func,
  /**
   * If `true`, the ripple pulsates, typically indicating the keyboard focus state of an element.
   */
  pulsate: import_prop_types.default.bool,
  /**
   * Diameter of the ripple.
   */
  rippleSize: import_prop_types.default.number,
  /**
   * Horizontal position of the ripple center.
   */
  rippleX: import_prop_types.default.number,
  /**
   * Vertical position of the ripple center.
   */
  rippleY: import_prop_types.default.number,
  /**
   * exit delay
   */
  timeout: import_prop_types.default.number.isRequired
} : void 0;
var Ripple_default = Ripple;

// node_modules/@mui/material/esm/ButtonBase/TouchRipple.js
var import_jsx_runtime2 = __toESM(require_jsx_runtime(), 1);
var DURATION = 550;
var DELAY_RIPPLE = 80;
var enterKeyframe = keyframes`
  0% {
    transform: scale(0);
    opacity: 0.1;
  }

  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`;
var exitKeyframe = keyframes`
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
`;
var pulsateKeyframe = keyframes`
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(0.92);
  }

  100% {
    transform: scale(1);
  }
`;
var TouchRippleRoot = styled_default("span", {
  name: "MuiTouchRipple",
  slot: "Root"
})({
  overflow: "hidden",
  pointerEvents: "none",
  position: "absolute",
  zIndex: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  borderRadius: "inherit"
});
var TouchRippleRipple = styled_default(Ripple_default, {
  name: "MuiTouchRipple",
  slot: "Ripple"
})`
  opacity: 0;
  position: absolute;

  &.${touchRippleClasses_default.rippleVisible} {
    opacity: 0.3;
    transform: scale(1);
    animation-name: ${enterKeyframe};
    animation-duration: ${DURATION}ms;
    animation-timing-function: ${({
  theme
}) => theme.transitions.easing.easeInOut};
  }

  &.${touchRippleClasses_default.ripplePulsate} {
    animation-duration: ${({
  theme
}) => theme.transitions.duration.shorter}ms;
  }

  & .${touchRippleClasses_default.child} {
    opacity: 1;
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: currentColor;
  }

  & .${touchRippleClasses_default.childLeaving} {
    opacity: 0;
    animation-name: ${exitKeyframe};
    animation-duration: ${DURATION}ms;
    animation-timing-function: ${({
  theme
}) => theme.transitions.easing.easeInOut};
  }

  & .${touchRippleClasses_default.childPulsate} {
    position: absolute;
    /* @noflip */
    left: 0px;
    top: 0;
    animation-name: ${pulsateKeyframe};
    animation-duration: 2500ms;
    animation-timing-function: ${({
  theme
}) => theme.transitions.easing.easeInOut};
    animation-iteration-count: infinite;
    animation-delay: 200ms;
  }
`;
var TouchRipple = React3.forwardRef(function TouchRipple2(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: "MuiTouchRipple"
  });
  const {
    center: centerProp = false,
    classes = {},
    className,
    ...other
  } = props;
  const [ripples, setRipples] = React3.useState([]);
  const nextKey = React3.useRef(0);
  const rippleCallback = React3.useRef(null);
  React3.useEffect(() => {
    if (rippleCallback.current) {
      rippleCallback.current();
      rippleCallback.current = null;
    }
  }, [ripples]);
  const ignoringMouseDown = React3.useRef(false);
  const startTimer = useTimeout();
  const startTimerCommit = React3.useRef(null);
  const container = React3.useRef(null);
  const startCommit = React3.useCallback((params) => {
    const {
      pulsate: pulsate2,
      rippleX,
      rippleY,
      rippleSize,
      cb
    } = params;
    setRipples((oldRipples) => [...oldRipples, (0, import_jsx_runtime2.jsx)(TouchRippleRipple, {
      classes: {
        ripple: clsx_default(classes.ripple, touchRippleClasses_default.ripple),
        rippleVisible: clsx_default(classes.rippleVisible, touchRippleClasses_default.rippleVisible),
        ripplePulsate: clsx_default(classes.ripplePulsate, touchRippleClasses_default.ripplePulsate),
        child: clsx_default(classes.child, touchRippleClasses_default.child),
        childLeaving: clsx_default(classes.childLeaving, touchRippleClasses_default.childLeaving),
        childPulsate: clsx_default(classes.childPulsate, touchRippleClasses_default.childPulsate)
      },
      timeout: DURATION,
      pulsate: pulsate2,
      rippleX,
      rippleY,
      rippleSize
    }, nextKey.current)]);
    nextKey.current += 1;
    rippleCallback.current = cb;
  }, [classes]);
  const start = React3.useCallback((event = {}, options = {}, cb = () => {
  }) => {
    const {
      pulsate: pulsate2 = false,
      center = centerProp || options.pulsate,
      fakeElement = false
      // For test purposes
    } = options;
    if (event?.type === "mousedown" && ignoringMouseDown.current) {
      ignoringMouseDown.current = false;
      return;
    }
    if (event?.type === "touchstart") {
      ignoringMouseDown.current = true;
    }
    const element = fakeElement ? null : container.current;
    const rect = element ? element.getBoundingClientRect() : {
      width: 0,
      height: 0,
      left: 0,
      top: 0
    };
    let rippleX;
    let rippleY;
    let rippleSize;
    if (center || event === void 0 || event.clientX === 0 && event.clientY === 0 || !event.clientX && !event.touches) {
      rippleX = Math.round(rect.width / 2);
      rippleY = Math.round(rect.height / 2);
    } else {
      const {
        clientX,
        clientY
      } = event.touches && event.touches.length > 0 ? event.touches[0] : event;
      rippleX = Math.round(clientX - rect.left);
      rippleY = Math.round(clientY - rect.top);
    }
    if (center) {
      rippleSize = Math.sqrt((2 * rect.width ** 2 + rect.height ** 2) / 3);
      if (rippleSize % 2 === 0) {
        rippleSize += 1;
      }
    } else {
      const sizeX = Math.max(Math.abs((element ? element.clientWidth : 0) - rippleX), rippleX) * 2 + 2;
      const sizeY = Math.max(Math.abs((element ? element.clientHeight : 0) - rippleY), rippleY) * 2 + 2;
      rippleSize = Math.sqrt(sizeX ** 2 + sizeY ** 2);
    }
    if (event?.touches) {
      if (startTimerCommit.current === null) {
        startTimerCommit.current = () => {
          startCommit({
            pulsate: pulsate2,
            rippleX,
            rippleY,
            rippleSize,
            cb
          });
        };
        startTimer.start(DELAY_RIPPLE, () => {
          if (startTimerCommit.current) {
            startTimerCommit.current();
            startTimerCommit.current = null;
          }
        });
      }
    } else {
      startCommit({
        pulsate: pulsate2,
        rippleX,
        rippleY,
        rippleSize,
        cb
      });
    }
  }, [centerProp, startCommit, startTimer]);
  const pulsate = React3.useCallback(() => {
    start({}, {
      pulsate: true
    });
  }, [start]);
  const stop = React3.useCallback((event, cb) => {
    startTimer.clear();
    if (event?.type === "touchend" && startTimerCommit.current) {
      startTimerCommit.current();
      startTimerCommit.current = null;
      startTimer.start(0, () => {
        stop(event, cb);
      });
      return;
    }
    startTimerCommit.current = null;
    setRipples((oldRipples) => {
      if (oldRipples.length > 0) {
        return oldRipples.slice(1);
      }
      return oldRipples;
    });
    rippleCallback.current = cb;
  }, [startTimer]);
  React3.useImperativeHandle(ref, () => ({
    pulsate,
    start,
    stop
  }), [pulsate, start, stop]);
  return (0, import_jsx_runtime2.jsx)(TouchRippleRoot, {
    className: clsx_default(touchRippleClasses_default.root, classes.root, className),
    ref: container,
    ...other,
    children: (0, import_jsx_runtime2.jsx)(TransitionGroup_default, {
      component: null,
      exit: true,
      children: ripples
    })
  });
});
true ? TouchRipple.propTypes = {
  /**
   * If `true`, the ripple starts at the center of the component
   * rather than at the point of interaction.
   */
  center: import_prop_types2.default.bool,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: import_prop_types2.default.object,
  /**
   * @ignore
   */
  className: import_prop_types2.default.string
} : void 0;
var TouchRipple_default = TouchRipple;

// node_modules/@mui/material/esm/ButtonBase/ButtonBase.js
var import_jsx_runtime3 = __toESM(require_jsx_runtime(), 1);
var useUtilityClasses = (ownerState) => {
  const {
    disabled,
    focusVisible,
    focusVisibleClassName,
    classes
  } = ownerState;
  const slots = {
    root: ["root", disabled && "disabled", focusVisible && "focusVisible"]
  };
  const composedClasses = composeClasses(slots, getButtonBaseUtilityClass, classes);
  if (focusVisible && focusVisibleClassName) {
    composedClasses.root += ` ${focusVisibleClassName}`;
  }
  return composedClasses;
};
var ButtonBaseRoot = styled_default("button", {
  name: "MuiButtonBase",
  slot: "Root"
})({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  boxSizing: "border-box",
  WebkitTapHighlightColor: "transparent",
  backgroundColor: "transparent",
  // Reset default value
  // We disable the focus ring for mouse, touch and keyboard users.
  outline: 0,
  border: 0,
  margin: 0,
  // Remove the margin in Safari
  borderRadius: 0,
  padding: 0,
  // Remove the padding in Firefox
  cursor: "pointer",
  userSelect: "none",
  verticalAlign: "middle",
  MozAppearance: "none",
  // Reset
  WebkitAppearance: "none",
  // Reset
  textDecoration: "none",
  // So we take precedent over the style of a native <a /> element.
  color: "inherit",
  "&::-moz-focus-inner": {
    borderStyle: "none"
    // Remove Firefox dotted outline.
  },
  [`&.${buttonBaseClasses_default.disabled}`]: {
    pointerEvents: "none",
    // Disable link interactions
    cursor: "default"
  },
  "@media print": {
    colorAdjust: "exact"
  }
});
var ButtonBase = React4.forwardRef(function ButtonBase2(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: "MuiButtonBase"
  });
  const {
    action,
    centerRipple = false,
    children,
    className,
    component = "button",
    disabled = false,
    disableRipple = false,
    disableTouchRipple = false,
    focusRipple = false,
    focusVisibleClassName,
    LinkComponent = "a",
    onBlur,
    onClick,
    onContextMenu,
    onDragLeave,
    onFocus,
    onFocusVisible,
    onKeyDown,
    onKeyUp,
    onMouseDown,
    onMouseLeave,
    onMouseUp,
    onTouchEnd,
    onTouchMove,
    onTouchStart,
    tabIndex = 0,
    TouchRippleProps,
    touchRippleRef,
    type,
    ...other
  } = props;
  const buttonRef = React4.useRef(null);
  const ripple = useLazyRipple();
  const handleRippleRef = useForkRef_default(ripple.ref, touchRippleRef);
  const [focusVisible, setFocusVisible] = React4.useState(false);
  if (disabled && focusVisible) {
    setFocusVisible(false);
  }
  React4.useImperativeHandle(action, () => ({
    focusVisible: () => {
      setFocusVisible(true);
      buttonRef.current.focus();
    }
  }), []);
  const enableTouchRipple = ripple.shouldMount && !disableRipple && !disabled;
  React4.useEffect(() => {
    if (focusVisible && focusRipple && !disableRipple) {
      ripple.pulsate();
    }
  }, [disableRipple, focusRipple, focusVisible, ripple]);
  const handleMouseDown = useRippleHandler(ripple, "start", onMouseDown, disableTouchRipple);
  const handleContextMenu = useRippleHandler(ripple, "stop", onContextMenu, disableTouchRipple);
  const handleDragLeave = useRippleHandler(ripple, "stop", onDragLeave, disableTouchRipple);
  const handleMouseUp = useRippleHandler(ripple, "stop", onMouseUp, disableTouchRipple);
  const handleMouseLeave = useRippleHandler(ripple, "stop", (event) => {
    if (focusVisible) {
      event.preventDefault();
    }
    if (onMouseLeave) {
      onMouseLeave(event);
    }
  }, disableTouchRipple);
  const handleTouchStart = useRippleHandler(ripple, "start", onTouchStart, disableTouchRipple);
  const handleTouchEnd = useRippleHandler(ripple, "stop", onTouchEnd, disableTouchRipple);
  const handleTouchMove = useRippleHandler(ripple, "stop", onTouchMove, disableTouchRipple);
  const handleBlur = useRippleHandler(ripple, "stop", (event) => {
    if (!isFocusVisible(event.target)) {
      setFocusVisible(false);
    }
    if (onBlur) {
      onBlur(event);
    }
  }, false);
  const handleFocus = useEventCallback_default2((event) => {
    if (!buttonRef.current) {
      buttonRef.current = event.currentTarget;
    }
    if (isFocusVisible(event.target)) {
      setFocusVisible(true);
      if (onFocusVisible) {
        onFocusVisible(event);
      }
    }
    if (onFocus) {
      onFocus(event);
    }
  });
  const isNonNativeButton = () => {
    const button = buttonRef.current;
    return component && component !== "button" && !(button.tagName === "A" && button.href);
  };
  const handleKeyDown = useEventCallback_default2((event) => {
    if (focusRipple && !event.repeat && focusVisible && event.key === " ") {
      ripple.stop(event, () => {
        ripple.start(event);
      });
    }
    if (event.target === event.currentTarget && isNonNativeButton() && event.key === " ") {
      event.preventDefault();
    }
    if (onKeyDown) {
      onKeyDown(event);
    }
    if (event.target === event.currentTarget && isNonNativeButton() && event.key === "Enter" && !disabled) {
      event.preventDefault();
      if (onClick) {
        onClick(event);
      }
    }
  });
  const handleKeyUp = useEventCallback_default2((event) => {
    if (focusRipple && event.key === " " && focusVisible && !event.defaultPrevented) {
      ripple.stop(event, () => {
        ripple.pulsate(event);
      });
    }
    if (onKeyUp) {
      onKeyUp(event);
    }
    if (onClick && event.target === event.currentTarget && isNonNativeButton() && event.key === " " && !event.defaultPrevented) {
      onClick(event);
    }
  });
  let ComponentProp = component;
  if (ComponentProp === "button" && (other.href || other.to)) {
    ComponentProp = LinkComponent;
  }
  const buttonProps = {};
  if (ComponentProp === "button") {
    buttonProps.type = type === void 0 ? "button" : type;
    buttonProps.disabled = disabled;
  } else {
    if (!other.href && !other.to) {
      buttonProps.role = "button";
    }
    if (disabled) {
      buttonProps["aria-disabled"] = disabled;
    }
  }
  const handleRef = useForkRef_default(ref, buttonRef);
  const ownerState = {
    ...props,
    centerRipple,
    component,
    disabled,
    disableRipple,
    disableTouchRipple,
    focusRipple,
    tabIndex,
    focusVisible
  };
  const classes = useUtilityClasses(ownerState);
  return (0, import_jsx_runtime3.jsxs)(ButtonBaseRoot, {
    as: ComponentProp,
    className: clsx_default(classes.root, className),
    ownerState,
    onBlur: handleBlur,
    onClick,
    onContextMenu: handleContextMenu,
    onFocus: handleFocus,
    onKeyDown: handleKeyDown,
    onKeyUp: handleKeyUp,
    onMouseDown: handleMouseDown,
    onMouseLeave: handleMouseLeave,
    onMouseUp: handleMouseUp,
    onDragLeave: handleDragLeave,
    onTouchEnd: handleTouchEnd,
    onTouchMove: handleTouchMove,
    onTouchStart: handleTouchStart,
    ref: handleRef,
    tabIndex: disabled ? -1 : tabIndex,
    type,
    ...buttonProps,
    ...other,
    children: [children, enableTouchRipple ? (0, import_jsx_runtime3.jsx)(TouchRipple_default, {
      ref: handleRippleRef,
      center: centerRipple,
      ...TouchRippleProps
    }) : null]
  });
});
function useRippleHandler(ripple, rippleAction, eventCallback, skipRippleAction = false) {
  return useEventCallback_default2((event) => {
    if (eventCallback) {
      eventCallback(event);
    }
    if (!skipRippleAction) {
      ripple[rippleAction](event);
    }
    return true;
  });
}
true ? ButtonBase.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * A ref for imperative actions.
   * It currently only supports `focusVisible()` action.
   */
  action: refType_default,
  /**
   * If `true`, the ripples are centered.
   * They won't start at the cursor interaction position.
   * @default false
   */
  centerRipple: import_prop_types3.default.bool,
  /**
   * The content of the component.
   */
  children: import_prop_types3.default.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: import_prop_types3.default.object,
  /**
   * @ignore
   */
  className: import_prop_types3.default.string,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: elementTypeAcceptingRef_default,
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: import_prop_types3.default.bool,
  /**
   * If `true`, the ripple effect is disabled.
   *
   * ⚠️ Without a ripple there is no styling for :focus-visible by default. Be sure
   * to highlight the element by applying separate styles with the `.Mui-focusVisible` class.
   * @default false
   */
  disableRipple: import_prop_types3.default.bool,
  /**
   * If `true`, the touch ripple effect is disabled.
   * @default false
   */
  disableTouchRipple: import_prop_types3.default.bool,
  /**
   * If `true`, the base button will have a keyboard focus ripple.
   * @default false
   */
  focusRipple: import_prop_types3.default.bool,
  /**
   * This prop can help identify which element has keyboard focus.
   * The class name will be applied when the element gains the focus through keyboard interaction.
   * It's a polyfill for the [CSS :focus-visible selector](https://drafts.csswg.org/selectors-4/#the-focus-visible-pseudo).
   * The rationale for using this feature [is explained here](https://github.com/WICG/focus-visible/blob/HEAD/explainer.md).
   * A [polyfill can be used](https://github.com/WICG/focus-visible) to apply a `focus-visible` class to other components
   * if needed.
   */
  focusVisibleClassName: import_prop_types3.default.string,
  /**
   * @ignore
   */
  href: import_prop_types3.default.any,
  /**
   * The component used to render a link when the `href` prop is provided.
   * @default 'a'
   */
  LinkComponent: import_prop_types3.default.elementType,
  /**
   * @ignore
   */
  onBlur: import_prop_types3.default.func,
  /**
   * @ignore
   */
  onClick: import_prop_types3.default.func,
  /**
   * @ignore
   */
  onContextMenu: import_prop_types3.default.func,
  /**
   * @ignore
   */
  onDragLeave: import_prop_types3.default.func,
  /**
   * @ignore
   */
  onFocus: import_prop_types3.default.func,
  /**
   * Callback fired when the component is focused with a keyboard.
   * We trigger a `onFocus` callback too.
   */
  onFocusVisible: import_prop_types3.default.func,
  /**
   * @ignore
   */
  onKeyDown: import_prop_types3.default.func,
  /**
   * @ignore
   */
  onKeyUp: import_prop_types3.default.func,
  /**
   * @ignore
   */
  onMouseDown: import_prop_types3.default.func,
  /**
   * @ignore
   */
  onMouseLeave: import_prop_types3.default.func,
  /**
   * @ignore
   */
  onMouseUp: import_prop_types3.default.func,
  /**
   * @ignore
   */
  onTouchEnd: import_prop_types3.default.func,
  /**
   * @ignore
   */
  onTouchMove: import_prop_types3.default.func,
  /**
   * @ignore
   */
  onTouchStart: import_prop_types3.default.func,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: import_prop_types3.default.oneOfType([import_prop_types3.default.arrayOf(import_prop_types3.default.oneOfType([import_prop_types3.default.func, import_prop_types3.default.object, import_prop_types3.default.bool])), import_prop_types3.default.func, import_prop_types3.default.object]),
  /**
   * @default 0
   */
  tabIndex: import_prop_types3.default.number,
  /**
   * Props applied to the `TouchRipple` element.
   */
  TouchRippleProps: import_prop_types3.default.object,
  /**
   * A ref that points to the `TouchRipple` element.
   */
  touchRippleRef: import_prop_types3.default.oneOfType([import_prop_types3.default.func, import_prop_types3.default.shape({
    current: import_prop_types3.default.shape({
      pulsate: import_prop_types3.default.func.isRequired,
      start: import_prop_types3.default.func.isRequired,
      stop: import_prop_types3.default.func.isRequired
    })
  })]),
  /**
   * @ignore
   */
  type: import_prop_types3.default.oneOfType([import_prop_types3.default.oneOf(["button", "reset", "submit"]), import_prop_types3.default.string])
} : void 0;
var ButtonBase_default = ButtonBase;

// node_modules/@mui/material/esm/CircularProgress/circularProgressClasses.js
function getCircularProgressUtilityClass(slot) {
  return generateUtilityClass("MuiCircularProgress", slot);
}
var circularProgressClasses = generateUtilityClasses("MuiCircularProgress", ["root", "determinate", "indeterminate", "colorPrimary", "colorSecondary", "svg", "circle", "circleDeterminate", "circleIndeterminate", "circleDisableShrink"]);
var circularProgressClasses_default = circularProgressClasses;

// node_modules/@mui/material/esm/CircularProgress/CircularProgress.js
var React5 = __toESM(require_react(), 1);
var import_prop_types4 = __toESM(require_prop_types(), 1);
var import_jsx_runtime4 = __toESM(require_jsx_runtime(), 1);
var SIZE = 44;
var circularRotateKeyframe = keyframes`
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
`;
var circularDashKeyframe = keyframes`
  0% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 100px, 200px;
    stroke-dashoffset: -15px;
  }

  100% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: -126px;
  }
`;
var rotateAnimation = typeof circularRotateKeyframe !== "string" ? css`
        animation: ${circularRotateKeyframe} 1.4s linear infinite;
      ` : null;
var dashAnimation = typeof circularDashKeyframe !== "string" ? css`
        animation: ${circularDashKeyframe} 1.4s ease-in-out infinite;
      ` : null;
var useUtilityClasses2 = (ownerState) => {
  const {
    classes,
    variant,
    color,
    disableShrink
  } = ownerState;
  const slots = {
    root: ["root", variant, `color${capitalize_default(color)}`],
    svg: ["svg"],
    circle: ["circle", `circle${capitalize_default(variant)}`, disableShrink && "circleDisableShrink"]
  };
  return composeClasses(slots, getCircularProgressUtilityClass, classes);
};
var CircularProgressRoot = styled_default("span", {
  name: "MuiCircularProgress",
  slot: "Root",
  overridesResolver: (props, styles2) => {
    const {
      ownerState
    } = props;
    return [styles2.root, styles2[ownerState.variant], styles2[`color${capitalize_default(ownerState.color)}`]];
  }
})(memoTheme_default(({
  theme
}) => ({
  display: "inline-block",
  variants: [{
    props: {
      variant: "determinate"
    },
    style: {
      transition: theme.transitions.create("transform")
    }
  }, {
    props: {
      variant: "indeterminate"
    },
    style: rotateAnimation || {
      animation: `${circularRotateKeyframe} 1.4s linear infinite`
    }
  }, ...Object.entries(theme.palette).filter(createSimplePaletteValueFilter()).map(([color]) => ({
    props: {
      color
    },
    style: {
      color: (theme.vars || theme).palette[color].main
    }
  }))]
})));
var CircularProgressSVG = styled_default("svg", {
  name: "MuiCircularProgress",
  slot: "Svg"
})({
  display: "block"
  // Keeps the progress centered
});
var CircularProgressCircle = styled_default("circle", {
  name: "MuiCircularProgress",
  slot: "Circle",
  overridesResolver: (props, styles2) => {
    const {
      ownerState
    } = props;
    return [styles2.circle, styles2[`circle${capitalize_default(ownerState.variant)}`], ownerState.disableShrink && styles2.circleDisableShrink];
  }
})(memoTheme_default(({
  theme
}) => ({
  stroke: "currentColor",
  variants: [{
    props: {
      variant: "determinate"
    },
    style: {
      transition: theme.transitions.create("stroke-dashoffset")
    }
  }, {
    props: {
      variant: "indeterminate"
    },
    style: {
      // Some default value that looks fine waiting for the animation to kicks in.
      strokeDasharray: "80px, 200px",
      strokeDashoffset: 0
      // Add the unit to fix a Edge 16 and below bug.
    }
  }, {
    props: ({
      ownerState
    }) => ownerState.variant === "indeterminate" && !ownerState.disableShrink,
    style: dashAnimation || {
      // At runtime for Pigment CSS, `bufferAnimation` will be null and the generated keyframe will be used.
      animation: `${circularDashKeyframe} 1.4s ease-in-out infinite`
    }
  }]
})));
var CircularProgress = React5.forwardRef(function CircularProgress2(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: "MuiCircularProgress"
  });
  const {
    className,
    color = "primary",
    disableShrink = false,
    size = 40,
    style,
    thickness = 3.6,
    value = 0,
    variant = "indeterminate",
    ...other
  } = props;
  const ownerState = {
    ...props,
    color,
    disableShrink,
    size,
    thickness,
    value,
    variant
  };
  const classes = useUtilityClasses2(ownerState);
  const circleStyle = {};
  const rootStyle = {};
  const rootProps = {};
  if (variant === "determinate") {
    const circumference = 2 * Math.PI * ((SIZE - thickness) / 2);
    circleStyle.strokeDasharray = circumference.toFixed(3);
    rootProps["aria-valuenow"] = Math.round(value);
    circleStyle.strokeDashoffset = `${((100 - value) / 100 * circumference).toFixed(3)}px`;
    rootStyle.transform = "rotate(-90deg)";
  }
  return (0, import_jsx_runtime4.jsx)(CircularProgressRoot, {
    className: clsx_default(classes.root, className),
    style: {
      width: size,
      height: size,
      ...rootStyle,
      ...style
    },
    ownerState,
    ref,
    role: "progressbar",
    ...rootProps,
    ...other,
    children: (0, import_jsx_runtime4.jsx)(CircularProgressSVG, {
      className: classes.svg,
      ownerState,
      viewBox: `${SIZE / 2} ${SIZE / 2} ${SIZE} ${SIZE}`,
      children: (0, import_jsx_runtime4.jsx)(CircularProgressCircle, {
        className: classes.circle,
        style: circleStyle,
        ownerState,
        cx: SIZE,
        cy: SIZE,
        r: (SIZE - thickness) / 2,
        fill: "none",
        strokeWidth: thickness
      })
    })
  });
});
true ? CircularProgress.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Override or extend the styles applied to the component.
   */
  classes: import_prop_types4.default.object,
  /**
   * @ignore
   */
  className: import_prop_types4.default.string,
  /**
   * The color of the component.
   * It supports both default and custom theme colors, which can be added as shown in the
   * [palette customization guide](https://mui.com/material-ui/customization/palette/#custom-colors).
   * @default 'primary'
   */
  color: import_prop_types4.default.oneOfType([import_prop_types4.default.oneOf(["inherit", "primary", "secondary", "error", "info", "success", "warning"]), import_prop_types4.default.string]),
  /**
   * If `true`, the shrink animation is disabled.
   * This only works if variant is `indeterminate`.
   * @default false
   */
  disableShrink: chainPropTypes(import_prop_types4.default.bool, (props) => {
    if (props.disableShrink && props.variant && props.variant !== "indeterminate") {
      return new Error("MUI: You have provided the `disableShrink` prop with a variant other than `indeterminate`. This will have no effect.");
    }
    return null;
  }),
  /**
   * The size of the component.
   * If using a number, the pixel unit is assumed.
   * If using a string, you need to provide the CSS unit, for example '3rem'.
   * @default 40
   */
  size: import_prop_types4.default.oneOfType([import_prop_types4.default.number, import_prop_types4.default.string]),
  /**
   * @ignore
   */
  style: import_prop_types4.default.object,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: import_prop_types4.default.oneOfType([import_prop_types4.default.arrayOf(import_prop_types4.default.oneOfType([import_prop_types4.default.func, import_prop_types4.default.object, import_prop_types4.default.bool])), import_prop_types4.default.func, import_prop_types4.default.object]),
  /**
   * The thickness of the circle.
   * @default 3.6
   */
  thickness: import_prop_types4.default.number,
  /**
   * The value of the progress indicator for the determinate variant.
   * Value between 0 and 100.
   * @default 0
   */
  value: import_prop_types4.default.number,
  /**
   * The variant to use.
   * Use indeterminate when there is no progress value.
   * @default 'indeterminate'
   */
  variant: import_prop_types4.default.oneOf(["determinate", "indeterminate"])
} : void 0;
var CircularProgress_default = CircularProgress;

// node_modules/@mui/material/esm/Button/buttonClasses.js
function getButtonUtilityClass(slot) {
  return generateUtilityClass("MuiButton", slot);
}
var buttonClasses = generateUtilityClasses("MuiButton", ["root", "text", "textInherit", "textPrimary", "textSecondary", "textSuccess", "textError", "textInfo", "textWarning", "outlined", "outlinedInherit", "outlinedPrimary", "outlinedSecondary", "outlinedSuccess", "outlinedError", "outlinedInfo", "outlinedWarning", "contained", "containedInherit", "containedPrimary", "containedSecondary", "containedSuccess", "containedError", "containedInfo", "containedWarning", "disableElevation", "focusVisible", "disabled", "colorInherit", "colorPrimary", "colorSecondary", "colorSuccess", "colorError", "colorInfo", "colorWarning", "textSizeSmall", "textSizeMedium", "textSizeLarge", "outlinedSizeSmall", "outlinedSizeMedium", "outlinedSizeLarge", "containedSizeSmall", "containedSizeMedium", "containedSizeLarge", "sizeMedium", "sizeSmall", "sizeLarge", "fullWidth", "startIcon", "endIcon", "icon", "iconSizeSmall", "iconSizeMedium", "iconSizeLarge", "loading", "loadingWrapper", "loadingIconPlaceholder", "loadingIndicator", "loadingPositionCenter", "loadingPositionStart", "loadingPositionEnd"]);
var buttonClasses_default = buttonClasses;

// node_modules/@mui/material/esm/ButtonGroup/ButtonGroupContext.js
var React6 = __toESM(require_react(), 1);
var ButtonGroupContext = React6.createContext({});
if (true) {
  ButtonGroupContext.displayName = "ButtonGroupContext";
}
var ButtonGroupContext_default = ButtonGroupContext;

// node_modules/@mui/material/esm/ButtonGroup/ButtonGroupButtonContext.js
var React7 = __toESM(require_react(), 1);
var ButtonGroupButtonContext = React7.createContext(void 0);
if (true) {
  ButtonGroupButtonContext.displayName = "ButtonGroupButtonContext";
}
var ButtonGroupButtonContext_default = ButtonGroupButtonContext;

// node_modules/@mui/material/esm/Button/Button.js
var React8 = __toESM(require_react(), 1);
var import_prop_types5 = __toESM(require_prop_types(), 1);
var import_jsx_runtime5 = __toESM(require_jsx_runtime(), 1);
var useUtilityClasses3 = (ownerState) => {
  const {
    color,
    disableElevation,
    fullWidth,
    size,
    variant,
    loading,
    loadingPosition,
    classes
  } = ownerState;
  const slots = {
    root: ["root", loading && "loading", variant, `${variant}${capitalize_default(color)}`, `size${capitalize_default(size)}`, `${variant}Size${capitalize_default(size)}`, `color${capitalize_default(color)}`, disableElevation && "disableElevation", fullWidth && "fullWidth", loading && `loadingPosition${capitalize_default(loadingPosition)}`],
    startIcon: ["icon", "startIcon", `iconSize${capitalize_default(size)}`],
    endIcon: ["icon", "endIcon", `iconSize${capitalize_default(size)}`],
    loadingIndicator: ["loadingIndicator"],
    loadingWrapper: ["loadingWrapper"]
  };
  const composedClasses = composeClasses(slots, getButtonUtilityClass, classes);
  return {
    ...classes,
    // forward the focused, disabled, etc. classes to the ButtonBase
    ...composedClasses
  };
};
var commonIconStyles = [{
  props: {
    size: "small"
  },
  style: {
    "& > *:nth-of-type(1)": {
      fontSize: 18
    }
  }
}, {
  props: {
    size: "medium"
  },
  style: {
    "& > *:nth-of-type(1)": {
      fontSize: 20
    }
  }
}, {
  props: {
    size: "large"
  },
  style: {
    "& > *:nth-of-type(1)": {
      fontSize: 22
    }
  }
}];
var ButtonRoot = styled_default(ButtonBase_default, {
  shouldForwardProp: (prop) => rootShouldForwardProp_default(prop) || prop === "classes",
  name: "MuiButton",
  slot: "Root",
  overridesResolver: (props, styles2) => {
    const {
      ownerState
    } = props;
    return [styles2.root, styles2[ownerState.variant], styles2[`${ownerState.variant}${capitalize_default(ownerState.color)}`], styles2[`size${capitalize_default(ownerState.size)}`], styles2[`${ownerState.variant}Size${capitalize_default(ownerState.size)}`], ownerState.color === "inherit" && styles2.colorInherit, ownerState.disableElevation && styles2.disableElevation, ownerState.fullWidth && styles2.fullWidth, ownerState.loading && styles2.loading];
  }
})(memoTheme_default(({
  theme
}) => {
  const inheritContainedBackgroundColor = theme.palette.mode === "light" ? theme.palette.grey[300] : theme.palette.grey[800];
  const inheritContainedHoverBackgroundColor = theme.palette.mode === "light" ? theme.palette.grey.A100 : theme.palette.grey[700];
  return {
    ...theme.typography.button,
    minWidth: 64,
    padding: "6px 16px",
    border: 0,
    borderRadius: (theme.vars || theme).shape.borderRadius,
    transition: theme.transitions.create(["background-color", "box-shadow", "border-color", "color"], {
      duration: theme.transitions.duration.short
    }),
    "&:hover": {
      textDecoration: "none"
    },
    [`&.${buttonClasses_default.disabled}`]: {
      color: (theme.vars || theme).palette.action.disabled
    },
    variants: [{
      props: {
        variant: "contained"
      },
      style: {
        color: `var(--variant-containedColor)`,
        backgroundColor: `var(--variant-containedBg)`,
        boxShadow: (theme.vars || theme).shadows[2],
        "&:hover": {
          boxShadow: (theme.vars || theme).shadows[4],
          // Reset on touch devices, it doesn't add specificity
          "@media (hover: none)": {
            boxShadow: (theme.vars || theme).shadows[2]
          }
        },
        "&:active": {
          boxShadow: (theme.vars || theme).shadows[8]
        },
        [`&.${buttonClasses_default.focusVisible}`]: {
          boxShadow: (theme.vars || theme).shadows[6]
        },
        [`&.${buttonClasses_default.disabled}`]: {
          color: (theme.vars || theme).palette.action.disabled,
          boxShadow: (theme.vars || theme).shadows[0],
          backgroundColor: (theme.vars || theme).palette.action.disabledBackground
        }
      }
    }, {
      props: {
        variant: "outlined"
      },
      style: {
        padding: "5px 15px",
        border: "1px solid currentColor",
        borderColor: `var(--variant-outlinedBorder, currentColor)`,
        backgroundColor: `var(--variant-outlinedBg)`,
        color: `var(--variant-outlinedColor)`,
        [`&.${buttonClasses_default.disabled}`]: {
          border: `1px solid ${(theme.vars || theme).palette.action.disabledBackground}`
        }
      }
    }, {
      props: {
        variant: "text"
      },
      style: {
        padding: "6px 8px",
        color: `var(--variant-textColor)`,
        backgroundColor: `var(--variant-textBg)`
      }
    }, ...Object.entries(theme.palette).filter(createSimplePaletteValueFilter()).map(([color]) => ({
      props: {
        color
      },
      style: {
        "--variant-textColor": (theme.vars || theme).palette[color].main,
        "--variant-outlinedColor": (theme.vars || theme).palette[color].main,
        "--variant-outlinedBorder": theme.vars ? `rgba(${theme.vars.palette[color].mainChannel} / 0.5)` : alpha(theme.palette[color].main, 0.5),
        "--variant-containedColor": (theme.vars || theme).palette[color].contrastText,
        "--variant-containedBg": (theme.vars || theme).palette[color].main,
        "@media (hover: hover)": {
          "&:hover": {
            "--variant-containedBg": (theme.vars || theme).palette[color].dark,
            "--variant-textBg": theme.vars ? `rgba(${theme.vars.palette[color].mainChannel} / ${theme.vars.palette.action.hoverOpacity})` : alpha(theme.palette[color].main, theme.palette.action.hoverOpacity),
            "--variant-outlinedBorder": (theme.vars || theme).palette[color].main,
            "--variant-outlinedBg": theme.vars ? `rgba(${theme.vars.palette[color].mainChannel} / ${theme.vars.palette.action.hoverOpacity})` : alpha(theme.palette[color].main, theme.palette.action.hoverOpacity)
          }
        }
      }
    })), {
      props: {
        color: "inherit"
      },
      style: {
        color: "inherit",
        borderColor: "currentColor",
        "--variant-containedBg": theme.vars ? theme.vars.palette.Button.inheritContainedBg : inheritContainedBackgroundColor,
        "@media (hover: hover)": {
          "&:hover": {
            "--variant-containedBg": theme.vars ? theme.vars.palette.Button.inheritContainedHoverBg : inheritContainedHoverBackgroundColor,
            "--variant-textBg": theme.vars ? `rgba(${theme.vars.palette.text.primaryChannel} / ${theme.vars.palette.action.hoverOpacity})` : alpha(theme.palette.text.primary, theme.palette.action.hoverOpacity),
            "--variant-outlinedBg": theme.vars ? `rgba(${theme.vars.palette.text.primaryChannel} / ${theme.vars.palette.action.hoverOpacity})` : alpha(theme.palette.text.primary, theme.palette.action.hoverOpacity)
          }
        }
      }
    }, {
      props: {
        size: "small",
        variant: "text"
      },
      style: {
        padding: "4px 5px",
        fontSize: theme.typography.pxToRem(13)
      }
    }, {
      props: {
        size: "large",
        variant: "text"
      },
      style: {
        padding: "8px 11px",
        fontSize: theme.typography.pxToRem(15)
      }
    }, {
      props: {
        size: "small",
        variant: "outlined"
      },
      style: {
        padding: "3px 9px",
        fontSize: theme.typography.pxToRem(13)
      }
    }, {
      props: {
        size: "large",
        variant: "outlined"
      },
      style: {
        padding: "7px 21px",
        fontSize: theme.typography.pxToRem(15)
      }
    }, {
      props: {
        size: "small",
        variant: "contained"
      },
      style: {
        padding: "4px 10px",
        fontSize: theme.typography.pxToRem(13)
      }
    }, {
      props: {
        size: "large",
        variant: "contained"
      },
      style: {
        padding: "8px 22px",
        fontSize: theme.typography.pxToRem(15)
      }
    }, {
      props: {
        disableElevation: true
      },
      style: {
        boxShadow: "none",
        "&:hover": {
          boxShadow: "none"
        },
        [`&.${buttonClasses_default.focusVisible}`]: {
          boxShadow: "none"
        },
        "&:active": {
          boxShadow: "none"
        },
        [`&.${buttonClasses_default.disabled}`]: {
          boxShadow: "none"
        }
      }
    }, {
      props: {
        fullWidth: true
      },
      style: {
        width: "100%"
      }
    }, {
      props: {
        loadingPosition: "center"
      },
      style: {
        transition: theme.transitions.create(["background-color", "box-shadow", "border-color"], {
          duration: theme.transitions.duration.short
        }),
        [`&.${buttonClasses_default.loading}`]: {
          color: "transparent"
        }
      }
    }]
  };
}));
var ButtonStartIcon = styled_default("span", {
  name: "MuiButton",
  slot: "StartIcon",
  overridesResolver: (props, styles2) => {
    const {
      ownerState
    } = props;
    return [styles2.startIcon, ownerState.loading && styles2.startIconLoadingStart, styles2[`iconSize${capitalize_default(ownerState.size)}`]];
  }
})(({
  theme
}) => ({
  display: "inherit",
  marginRight: 8,
  marginLeft: -4,
  variants: [{
    props: {
      size: "small"
    },
    style: {
      marginLeft: -2
    }
  }, {
    props: {
      loadingPosition: "start",
      loading: true
    },
    style: {
      transition: theme.transitions.create(["opacity"], {
        duration: theme.transitions.duration.short
      }),
      opacity: 0
    }
  }, {
    props: {
      loadingPosition: "start",
      loading: true,
      fullWidth: true
    },
    style: {
      marginRight: -8
    }
  }, ...commonIconStyles]
}));
var ButtonEndIcon = styled_default("span", {
  name: "MuiButton",
  slot: "EndIcon",
  overridesResolver: (props, styles2) => {
    const {
      ownerState
    } = props;
    return [styles2.endIcon, ownerState.loading && styles2.endIconLoadingEnd, styles2[`iconSize${capitalize_default(ownerState.size)}`]];
  }
})(({
  theme
}) => ({
  display: "inherit",
  marginRight: -4,
  marginLeft: 8,
  variants: [{
    props: {
      size: "small"
    },
    style: {
      marginRight: -2
    }
  }, {
    props: {
      loadingPosition: "end",
      loading: true
    },
    style: {
      transition: theme.transitions.create(["opacity"], {
        duration: theme.transitions.duration.short
      }),
      opacity: 0
    }
  }, {
    props: {
      loadingPosition: "end",
      loading: true,
      fullWidth: true
    },
    style: {
      marginLeft: -8
    }
  }, ...commonIconStyles]
}));
var ButtonLoadingIndicator = styled_default("span", {
  name: "MuiButton",
  slot: "LoadingIndicator"
})(({
  theme
}) => ({
  display: "none",
  position: "absolute",
  visibility: "visible",
  variants: [{
    props: {
      loading: true
    },
    style: {
      display: "flex"
    }
  }, {
    props: {
      loadingPosition: "start"
    },
    style: {
      left: 14
    }
  }, {
    props: {
      loadingPosition: "start",
      size: "small"
    },
    style: {
      left: 10
    }
  }, {
    props: {
      variant: "text",
      loadingPosition: "start"
    },
    style: {
      left: 6
    }
  }, {
    props: {
      loadingPosition: "center"
    },
    style: {
      left: "50%",
      transform: "translate(-50%)",
      color: (theme.vars || theme).palette.action.disabled
    }
  }, {
    props: {
      loadingPosition: "end"
    },
    style: {
      right: 14
    }
  }, {
    props: {
      loadingPosition: "end",
      size: "small"
    },
    style: {
      right: 10
    }
  }, {
    props: {
      variant: "text",
      loadingPosition: "end"
    },
    style: {
      right: 6
    }
  }, {
    props: {
      loadingPosition: "start",
      fullWidth: true
    },
    style: {
      position: "relative",
      left: -10
    }
  }, {
    props: {
      loadingPosition: "end",
      fullWidth: true
    },
    style: {
      position: "relative",
      right: -10
    }
  }]
}));
var ButtonLoadingIconPlaceholder = styled_default("span", {
  name: "MuiButton",
  slot: "LoadingIconPlaceholder"
})({
  display: "inline-block",
  width: "1em",
  height: "1em"
});
var Button = React8.forwardRef(function Button2(inProps, ref) {
  const contextProps = React8.useContext(ButtonGroupContext_default);
  const buttonGroupButtonContextPositionClassName = React8.useContext(ButtonGroupButtonContext_default);
  const resolvedProps = resolveProps(contextProps, inProps);
  const props = useDefaultProps({
    props: resolvedProps,
    name: "MuiButton"
  });
  const {
    children,
    color = "primary",
    component = "button",
    className,
    disabled = false,
    disableElevation = false,
    disableFocusRipple = false,
    endIcon: endIconProp,
    focusVisibleClassName,
    fullWidth = false,
    id: idProp,
    loading = null,
    loadingIndicator: loadingIndicatorProp,
    loadingPosition = "center",
    size = "medium",
    startIcon: startIconProp,
    type,
    variant = "text",
    ...other
  } = props;
  const loadingId = useId_default(idProp);
  const loadingIndicator = loadingIndicatorProp ?? (0, import_jsx_runtime5.jsx)(CircularProgress_default, {
    "aria-labelledby": loadingId,
    color: "inherit",
    size: 16
  });
  const ownerState = {
    ...props,
    color,
    component,
    disabled,
    disableElevation,
    disableFocusRipple,
    fullWidth,
    loading,
    loadingIndicator,
    loadingPosition,
    size,
    type,
    variant
  };
  const classes = useUtilityClasses3(ownerState);
  const startIcon = (startIconProp || loading && loadingPosition === "start") && (0, import_jsx_runtime5.jsx)(ButtonStartIcon, {
    className: classes.startIcon,
    ownerState,
    children: startIconProp || (0, import_jsx_runtime5.jsx)(ButtonLoadingIconPlaceholder, {
      className: classes.loadingIconPlaceholder,
      ownerState
    })
  });
  const endIcon = (endIconProp || loading && loadingPosition === "end") && (0, import_jsx_runtime5.jsx)(ButtonEndIcon, {
    className: classes.endIcon,
    ownerState,
    children: endIconProp || (0, import_jsx_runtime5.jsx)(ButtonLoadingIconPlaceholder, {
      className: classes.loadingIconPlaceholder,
      ownerState
    })
  });
  const positionClassName = buttonGroupButtonContextPositionClassName || "";
  const loader = typeof loading === "boolean" ? (
    // use plain HTML span to minimize the runtime overhead
    (0, import_jsx_runtime5.jsx)("span", {
      className: classes.loadingWrapper,
      style: {
        display: "contents"
      },
      children: loading && (0, import_jsx_runtime5.jsx)(ButtonLoadingIndicator, {
        className: classes.loadingIndicator,
        ownerState,
        children: loadingIndicator
      })
    })
  ) : null;
  return (0, import_jsx_runtime5.jsxs)(ButtonRoot, {
    ownerState,
    className: clsx_default(contextProps.className, classes.root, className, positionClassName),
    component,
    disabled: disabled || loading,
    focusRipple: !disableFocusRipple,
    focusVisibleClassName: clsx_default(classes.focusVisible, focusVisibleClassName),
    ref,
    type,
    id: loading ? loadingId : idProp,
    ...other,
    classes,
    children: [startIcon, loadingPosition !== "end" && loader, children, loadingPosition === "end" && loader, endIcon]
  });
});
true ? Button.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component.
   */
  children: import_prop_types5.default.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: import_prop_types5.default.object,
  /**
   * @ignore
   */
  className: import_prop_types5.default.string,
  /**
   * The color of the component.
   * It supports both default and custom theme colors, which can be added as shown in the
   * [palette customization guide](https://mui.com/material-ui/customization/palette/#custom-colors).
   * @default 'primary'
   */
  color: import_prop_types5.default.oneOfType([import_prop_types5.default.oneOf(["inherit", "primary", "secondary", "success", "error", "info", "warning"]), import_prop_types5.default.string]),
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: import_prop_types5.default.elementType,
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: import_prop_types5.default.bool,
  /**
   * If `true`, no elevation is used.
   * @default false
   */
  disableElevation: import_prop_types5.default.bool,
  /**
   * If `true`, the  keyboard focus ripple is disabled.
   * @default false
   */
  disableFocusRipple: import_prop_types5.default.bool,
  /**
   * If `true`, the ripple effect is disabled.
   *
   * ⚠️ Without a ripple there is no styling for :focus-visible by default. Be sure
   * to highlight the element by applying separate styles with the `.Mui-focusVisible` class.
   * @default false
   */
  disableRipple: import_prop_types5.default.bool,
  /**
   * Element placed after the children.
   */
  endIcon: import_prop_types5.default.node,
  /**
   * @ignore
   */
  focusVisibleClassName: import_prop_types5.default.string,
  /**
   * If `true`, the button will take up the full width of its container.
   * @default false
   */
  fullWidth: import_prop_types5.default.bool,
  /**
   * The URL to link to when the button is clicked.
   * If defined, an `a` element will be used as the root node.
   */
  href: import_prop_types5.default.string,
  /**
   * @ignore
   */
  id: import_prop_types5.default.string,
  /**
   * If `true`, the loading indicator is visible and the button is disabled.
   * If `true | false`, the loading wrapper is always rendered before the children to prevent [Google Translation Crash](https://github.com/mui/material-ui/issues/27853).
   * @default null
   */
  loading: import_prop_types5.default.bool,
  /**
   * Element placed before the children if the button is in loading state.
   * The node should contain an element with `role="progressbar"` with an accessible name.
   * By default, it renders a `CircularProgress` that is labeled by the button itself.
   * @default <CircularProgress color="inherit" size={16} />
   */
  loadingIndicator: import_prop_types5.default.node,
  /**
   * The loading indicator can be positioned on the start, end, or the center of the button.
   * @default 'center'
   */
  loadingPosition: import_prop_types5.default.oneOf(["center", "end", "start"]),
  /**
   * The size of the component.
   * `small` is equivalent to the dense button styling.
   * @default 'medium'
   */
  size: import_prop_types5.default.oneOfType([import_prop_types5.default.oneOf(["small", "medium", "large"]), import_prop_types5.default.string]),
  /**
   * Element placed before the children.
   */
  startIcon: import_prop_types5.default.node,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: import_prop_types5.default.oneOfType([import_prop_types5.default.arrayOf(import_prop_types5.default.oneOfType([import_prop_types5.default.func, import_prop_types5.default.object, import_prop_types5.default.bool])), import_prop_types5.default.func, import_prop_types5.default.object]),
  /**
   * @ignore
   */
  type: import_prop_types5.default.oneOfType([import_prop_types5.default.oneOf(["button", "reset", "submit"]), import_prop_types5.default.string]),
  /**
   * The variant to use.
   * @default 'text'
   */
  variant: import_prop_types5.default.oneOfType([import_prop_types5.default.oneOf(["contained", "outlined", "text"]), import_prop_types5.default.string])
} : void 0;
var Button_default = Button;

// node_modules/@mui/material/esm/TabScrollButton/tabScrollButtonClasses.js
function getTabScrollButtonUtilityClass(slot) {
  return generateUtilityClass("MuiTabScrollButton", slot);
}
var tabScrollButtonClasses = generateUtilityClasses("MuiTabScrollButton", ["root", "vertical", "horizontal", "disabled"]);
var tabScrollButtonClasses_default = tabScrollButtonClasses;

// node_modules/@mui/material/esm/TabScrollButton/TabScrollButton.js
var React11 = __toESM(require_react(), 1);
var import_prop_types6 = __toESM(require_prop_types(), 1);

// node_modules/@mui/material/esm/internal/svg-icons/KeyboardArrowLeft.js
var React9 = __toESM(require_react(), 1);
var import_jsx_runtime6 = __toESM(require_jsx_runtime(), 1);
var KeyboardArrowLeft_default = createSvgIcon((0, import_jsx_runtime6.jsx)("path", {
  d: "M15.41 16.09l-4.58-4.59 4.58-4.59L14 5.5l-6 6 6 6z"
}), "KeyboardArrowLeft");

// node_modules/@mui/material/esm/internal/svg-icons/KeyboardArrowRight.js
var React10 = __toESM(require_react(), 1);
var import_jsx_runtime7 = __toESM(require_jsx_runtime(), 1);
var KeyboardArrowRight_default = createSvgIcon((0, import_jsx_runtime7.jsx)("path", {
  d: "M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"
}), "KeyboardArrowRight");

// node_modules/@mui/material/esm/TabScrollButton/TabScrollButton.js
var import_jsx_runtime8 = __toESM(require_jsx_runtime(), 1);
var useUtilityClasses4 = (ownerState) => {
  const {
    classes,
    orientation,
    disabled
  } = ownerState;
  const slots = {
    root: ["root", orientation, disabled && "disabled"]
  };
  return composeClasses(slots, getTabScrollButtonUtilityClass, classes);
};
var TabScrollButtonRoot = styled_default(ButtonBase_default, {
  name: "MuiTabScrollButton",
  slot: "Root",
  overridesResolver: (props, styles2) => {
    const {
      ownerState
    } = props;
    return [styles2.root, ownerState.orientation && styles2[ownerState.orientation]];
  }
})({
  width: 40,
  flexShrink: 0,
  opacity: 0.8,
  [`&.${tabScrollButtonClasses_default.disabled}`]: {
    opacity: 0
  },
  variants: [{
    props: {
      orientation: "vertical"
    },
    style: {
      width: "100%",
      height: 40,
      "& svg": {
        transform: "var(--TabScrollButton-svgRotate)"
      }
    }
  }]
});
var TabScrollButton = React11.forwardRef(function TabScrollButton2(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: "MuiTabScrollButton"
  });
  const {
    className,
    slots = {},
    slotProps = {},
    direction,
    orientation,
    disabled,
    ...other
  } = props;
  const isRtl = useRtl();
  const ownerState = {
    isRtl,
    ...props
  };
  const classes = useUtilityClasses4(ownerState);
  const StartButtonIcon = slots.StartScrollButtonIcon ?? KeyboardArrowLeft_default;
  const EndButtonIcon = slots.EndScrollButtonIcon ?? KeyboardArrowRight_default;
  const startButtonIconProps = useSlotProps_default({
    elementType: StartButtonIcon,
    externalSlotProps: slotProps.startScrollButtonIcon,
    additionalProps: {
      fontSize: "small"
    },
    ownerState
  });
  const endButtonIconProps = useSlotProps_default({
    elementType: EndButtonIcon,
    externalSlotProps: slotProps.endScrollButtonIcon,
    additionalProps: {
      fontSize: "small"
    },
    ownerState
  });
  return (0, import_jsx_runtime8.jsx)(TabScrollButtonRoot, {
    component: "div",
    className: clsx_default(classes.root, className),
    ref,
    role: null,
    ownerState,
    tabIndex: null,
    ...other,
    style: {
      ...other.style,
      ...orientation === "vertical" && {
        "--TabScrollButton-svgRotate": `rotate(${isRtl ? -90 : 90}deg)`
      }
    },
    children: direction === "left" ? (0, import_jsx_runtime8.jsx)(StartButtonIcon, {
      ...startButtonIconProps
    }) : (0, import_jsx_runtime8.jsx)(EndButtonIcon, {
      ...endButtonIconProps
    })
  });
});
true ? TabScrollButton.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component.
   */
  children: import_prop_types6.default.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: import_prop_types6.default.object,
  /**
   * @ignore
   */
  className: import_prop_types6.default.string,
  /**
   * The direction the button should indicate.
   */
  direction: import_prop_types6.default.oneOf(["left", "right"]).isRequired,
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: import_prop_types6.default.bool,
  /**
   * The component orientation (layout flow direction).
   */
  orientation: import_prop_types6.default.oneOf(["horizontal", "vertical"]).isRequired,
  /**
   * The extra props for the slot components.
   * You can override the existing props or add new ones.
   * @default {}
   */
  slotProps: import_prop_types6.default.shape({
    endScrollButtonIcon: import_prop_types6.default.oneOfType([import_prop_types6.default.func, import_prop_types6.default.object]),
    startScrollButtonIcon: import_prop_types6.default.oneOfType([import_prop_types6.default.func, import_prop_types6.default.object])
  }),
  /**
   * The components used for each slot inside.
   * @default {}
   */
  slots: import_prop_types6.default.shape({
    EndScrollButtonIcon: import_prop_types6.default.elementType,
    StartScrollButtonIcon: import_prop_types6.default.elementType
  }),
  /**
   * @ignore
   */
  style: import_prop_types6.default.object,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: import_prop_types6.default.oneOfType([import_prop_types6.default.arrayOf(import_prop_types6.default.oneOfType([import_prop_types6.default.func, import_prop_types6.default.object, import_prop_types6.default.bool])), import_prop_types6.default.func, import_prop_types6.default.object])
} : void 0;
var TabScrollButton_default = TabScrollButton;

// node_modules/@mui/material/esm/Tabs/tabsClasses.js
function getTabsUtilityClass(slot) {
  return generateUtilityClass("MuiTabs", slot);
}
var tabsClasses = generateUtilityClasses("MuiTabs", ["root", "vertical", "list", "flexContainer", "flexContainerVertical", "centered", "scroller", "fixed", "scrollableX", "scrollableY", "hideScrollbar", "scrollButtons", "scrollButtonsHideMobile", "indicator"]);
var tabsClasses_default = tabsClasses;

// node_modules/@mui/material/esm/Tabs/Tabs.js
var React13 = __toESM(require_react(), 1);
var import_react_is = __toESM(require_react_is(), 1);
var import_prop_types8 = __toESM(require_prop_types(), 1);

// node_modules/@mui/material/esm/internal/animate.js
function easeInOutSin(time) {
  return (1 + Math.sin(Math.PI * time - Math.PI / 2)) / 2;
}
function animate(property, element, to, options = {}, cb = () => {
}) {
  const {
    ease = easeInOutSin,
    duration = 300
    // standard
  } = options;
  let start = null;
  const from = element[property];
  let cancelled = false;
  const cancel = () => {
    cancelled = true;
  };
  const step = (timestamp) => {
    if (cancelled) {
      cb(new Error("Animation cancelled"));
      return;
    }
    if (start === null) {
      start = timestamp;
    }
    const time = Math.min(1, (timestamp - start) / duration);
    element[property] = ease(time) * (to - from) + from;
    if (time >= 1) {
      requestAnimationFrame(() => {
        cb(null);
      });
      return;
    }
    requestAnimationFrame(step);
  };
  if (from === to) {
    cb(new Error("Element already at target position"));
    return cancel;
  }
  requestAnimationFrame(step);
  return cancel;
}

// node_modules/@mui/material/esm/Tabs/ScrollbarSize.js
var React12 = __toESM(require_react(), 1);
var import_prop_types7 = __toESM(require_prop_types(), 1);
var import_jsx_runtime9 = __toESM(require_jsx_runtime(), 1);
var styles = {
  width: 99,
  height: 99,
  position: "absolute",
  top: -9999,
  overflow: "scroll"
};
function ScrollbarSize(props) {
  const {
    onChange,
    ...other
  } = props;
  const scrollbarHeight = React12.useRef();
  const nodeRef = React12.useRef(null);
  const setMeasurements = () => {
    scrollbarHeight.current = nodeRef.current.offsetHeight - nodeRef.current.clientHeight;
  };
  useEnhancedEffect_default(() => {
    const handleResize = debounce_default(() => {
      const prevHeight = scrollbarHeight.current;
      setMeasurements();
      if (prevHeight !== scrollbarHeight.current) {
        onChange(scrollbarHeight.current);
      }
    });
    const containerWindow = ownerWindow_default(nodeRef.current);
    containerWindow.addEventListener("resize", handleResize);
    return () => {
      handleResize.clear();
      containerWindow.removeEventListener("resize", handleResize);
    };
  }, [onChange]);
  React12.useEffect(() => {
    setMeasurements();
    onChange(scrollbarHeight.current);
  }, [onChange]);
  return (0, import_jsx_runtime9.jsx)("div", {
    style: styles,
    ...other,
    ref: nodeRef
  });
}
true ? ScrollbarSize.propTypes = {
  onChange: import_prop_types7.default.func.isRequired
} : void 0;

// node_modules/@mui/material/esm/Tabs/Tabs.js
var import_jsx_runtime10 = __toESM(require_jsx_runtime(), 1);
var nextItem = (list, item) => {
  if (list === item) {
    return list.firstChild;
  }
  if (item && item.nextElementSibling) {
    return item.nextElementSibling;
  }
  return list.firstChild;
};
var previousItem = (list, item) => {
  if (list === item) {
    return list.lastChild;
  }
  if (item && item.previousElementSibling) {
    return item.previousElementSibling;
  }
  return list.lastChild;
};
var moveFocus = (list, currentFocus, traversalFunction) => {
  let wrappedOnce = false;
  let nextFocus = traversalFunction(list, currentFocus);
  while (nextFocus) {
    if (nextFocus === list.firstChild) {
      if (wrappedOnce) {
        return;
      }
      wrappedOnce = true;
    }
    const nextFocusDisabled = nextFocus.disabled || nextFocus.getAttribute("aria-disabled") === "true";
    if (!nextFocus.hasAttribute("tabindex") || nextFocusDisabled) {
      nextFocus = traversalFunction(list, nextFocus);
    } else {
      nextFocus.focus();
      return;
    }
  }
};
var useUtilityClasses5 = (ownerState) => {
  const {
    vertical,
    fixed,
    hideScrollbar,
    scrollableX,
    scrollableY,
    centered,
    scrollButtonsHideMobile,
    classes
  } = ownerState;
  const slots = {
    root: ["root", vertical && "vertical"],
    scroller: ["scroller", fixed && "fixed", hideScrollbar && "hideScrollbar", scrollableX && "scrollableX", scrollableY && "scrollableY"],
    list: ["list", "flexContainer", vertical && "flexContainerVertical", vertical && "vertical", centered && "centered"],
    indicator: ["indicator"],
    scrollButtons: ["scrollButtons", scrollButtonsHideMobile && "scrollButtonsHideMobile"],
    scrollableX: [scrollableX && "scrollableX"],
    hideScrollbar: [hideScrollbar && "hideScrollbar"]
  };
  return composeClasses(slots, getTabsUtilityClass, classes);
};
var TabsRoot = styled_default("div", {
  name: "MuiTabs",
  slot: "Root",
  overridesResolver: (props, styles2) => {
    const {
      ownerState
    } = props;
    return [{
      [`& .${tabsClasses_default.scrollButtons}`]: styles2.scrollButtons
    }, {
      [`& .${tabsClasses_default.scrollButtons}`]: ownerState.scrollButtonsHideMobile && styles2.scrollButtonsHideMobile
    }, styles2.root, ownerState.vertical && styles2.vertical];
  }
})(memoTheme_default(({
  theme
}) => ({
  overflow: "hidden",
  minHeight: 48,
  // Add iOS momentum scrolling for iOS < 13.0
  WebkitOverflowScrolling: "touch",
  display: "flex",
  variants: [{
    props: ({
      ownerState
    }) => ownerState.vertical,
    style: {
      flexDirection: "column"
    }
  }, {
    props: ({
      ownerState
    }) => ownerState.scrollButtonsHideMobile,
    style: {
      [`& .${tabsClasses_default.scrollButtons}`]: {
        [theme.breakpoints.down("sm")]: {
          display: "none"
        }
      }
    }
  }]
})));
var TabsScroller = styled_default("div", {
  name: "MuiTabs",
  slot: "Scroller",
  overridesResolver: (props, styles2) => {
    const {
      ownerState
    } = props;
    return [styles2.scroller, ownerState.fixed && styles2.fixed, ownerState.hideScrollbar && styles2.hideScrollbar, ownerState.scrollableX && styles2.scrollableX, ownerState.scrollableY && styles2.scrollableY];
  }
})({
  position: "relative",
  display: "inline-block",
  flex: "1 1 auto",
  whiteSpace: "nowrap",
  variants: [{
    props: ({
      ownerState
    }) => ownerState.fixed,
    style: {
      overflowX: "hidden",
      width: "100%"
    }
  }, {
    props: ({
      ownerState
    }) => ownerState.hideScrollbar,
    style: {
      // Hide dimensionless scrollbar on macOS
      scrollbarWidth: "none",
      // Firefox
      "&::-webkit-scrollbar": {
        display: "none"
        // Safari + Chrome
      }
    }
  }, {
    props: ({
      ownerState
    }) => ownerState.scrollableX,
    style: {
      overflowX: "auto",
      overflowY: "hidden"
    }
  }, {
    props: ({
      ownerState
    }) => ownerState.scrollableY,
    style: {
      overflowY: "auto",
      overflowX: "hidden"
    }
  }]
});
var List = styled_default("div", {
  name: "MuiTabs",
  slot: "List",
  overridesResolver: (props, styles2) => {
    const {
      ownerState
    } = props;
    return [styles2.list, styles2.flexContainer, ownerState.vertical && styles2.flexContainerVertical, ownerState.centered && styles2.centered];
  }
})({
  display: "flex",
  variants: [{
    props: ({
      ownerState
    }) => ownerState.vertical,
    style: {
      flexDirection: "column"
    }
  }, {
    props: ({
      ownerState
    }) => ownerState.centered,
    style: {
      justifyContent: "center"
    }
  }]
});
var TabsIndicator = styled_default("span", {
  name: "MuiTabs",
  slot: "Indicator"
})(memoTheme_default(({
  theme
}) => ({
  position: "absolute",
  height: 2,
  bottom: 0,
  width: "100%",
  transition: theme.transitions.create(),
  variants: [{
    props: {
      indicatorColor: "primary"
    },
    style: {
      backgroundColor: (theme.vars || theme).palette.primary.main
    }
  }, {
    props: {
      indicatorColor: "secondary"
    },
    style: {
      backgroundColor: (theme.vars || theme).palette.secondary.main
    }
  }, {
    props: ({
      ownerState
    }) => ownerState.vertical,
    style: {
      height: "100%",
      width: 2,
      right: 0
    }
  }]
})));
var TabsScrollbarSize = styled_default(ScrollbarSize)({
  overflowX: "auto",
  overflowY: "hidden",
  // Hide dimensionless scrollbar on macOS
  scrollbarWidth: "none",
  // Firefox
  "&::-webkit-scrollbar": {
    display: "none"
    // Safari + Chrome
  }
});
var defaultIndicatorStyle = {};
var warnedOnceTabPresent = false;
var Tabs = React13.forwardRef(function Tabs2(inProps, ref) {
  const props = useDefaultProps({
    props: inProps,
    name: "MuiTabs"
  });
  const theme = useTheme();
  const isRtl = useRtl();
  const {
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    action,
    centered = false,
    children: childrenProp,
    className,
    component = "div",
    allowScrollButtonsMobile = false,
    indicatorColor = "primary",
    onChange,
    orientation = "horizontal",
    ScrollButtonComponent,
    // TODO: remove in v7 (deprecated in v6)
    scrollButtons = "auto",
    selectionFollowsFocus,
    slots = {},
    slotProps = {},
    TabIndicatorProps = {},
    // TODO: remove in v7 (deprecated in v6)
    TabScrollButtonProps = {},
    // TODO: remove in v7 (deprecated in v6)
    textColor = "primary",
    value,
    variant = "standard",
    visibleScrollbar = false,
    ...other
  } = props;
  const scrollable = variant === "scrollable";
  const vertical = orientation === "vertical";
  const scrollStart = vertical ? "scrollTop" : "scrollLeft";
  const start = vertical ? "top" : "left";
  const end = vertical ? "bottom" : "right";
  const clientSize = vertical ? "clientHeight" : "clientWidth";
  const size = vertical ? "height" : "width";
  const ownerState = {
    ...props,
    component,
    allowScrollButtonsMobile,
    indicatorColor,
    orientation,
    vertical,
    scrollButtons,
    textColor,
    variant,
    visibleScrollbar,
    fixed: !scrollable,
    hideScrollbar: scrollable && !visibleScrollbar,
    scrollableX: scrollable && !vertical,
    scrollableY: scrollable && vertical,
    centered: centered && !scrollable,
    scrollButtonsHideMobile: !allowScrollButtonsMobile
  };
  const classes = useUtilityClasses5(ownerState);
  const startScrollButtonIconProps = useSlotProps_default({
    elementType: slots.StartScrollButtonIcon,
    externalSlotProps: slotProps.startScrollButtonIcon,
    ownerState
  });
  const endScrollButtonIconProps = useSlotProps_default({
    elementType: slots.EndScrollButtonIcon,
    externalSlotProps: slotProps.endScrollButtonIcon,
    ownerState
  });
  if (true) {
    if (centered && scrollable) {
      console.error('MUI: You can not use the `centered={true}` and `variant="scrollable"` properties at the same time on a `Tabs` component.');
    }
  }
  const [mounted, setMounted] = React13.useState(false);
  const [indicatorStyle, setIndicatorStyle] = React13.useState(defaultIndicatorStyle);
  const [displayStartScroll, setDisplayStartScroll] = React13.useState(false);
  const [displayEndScroll, setDisplayEndScroll] = React13.useState(false);
  const [updateScrollObserver, setUpdateScrollObserver] = React13.useState(false);
  const [scrollerStyle, setScrollerStyle] = React13.useState({
    overflow: "hidden",
    scrollbarWidth: 0
  });
  const valueToIndex = /* @__PURE__ */ new Map();
  const tabsRef = React13.useRef(null);
  const tabListRef = React13.useRef(null);
  const externalForwardedProps = {
    slots,
    slotProps: {
      indicator: TabIndicatorProps,
      scrollButton: TabScrollButtonProps,
      ...slotProps
    }
  };
  const getTabsMeta = () => {
    const tabsNode = tabsRef.current;
    let tabsMeta;
    if (tabsNode) {
      const rect = tabsNode.getBoundingClientRect();
      tabsMeta = {
        clientWidth: tabsNode.clientWidth,
        scrollLeft: tabsNode.scrollLeft,
        scrollTop: tabsNode.scrollTop,
        scrollWidth: tabsNode.scrollWidth,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right
      };
    }
    let tabMeta;
    if (tabsNode && value !== false) {
      const children2 = tabListRef.current.children;
      if (children2.length > 0) {
        const tab = children2[valueToIndex.get(value)];
        if (true) {
          if (!tab) {
            console.error([`MUI: The \`value\` provided to the Tabs component is invalid.`, `None of the Tabs' children match with "${value}".`, valueToIndex.keys ? `You can provide one of the following values: ${Array.from(valueToIndex.keys()).join(", ")}.` : null].join("\n"));
          }
        }
        tabMeta = tab ? tab.getBoundingClientRect() : null;
        if (true) {
          if (!warnedOnceTabPresent && tabMeta && tabMeta.width === 0 && tabMeta.height === 0 && // if the whole Tabs component is hidden, don't warn
          tabsMeta.clientWidth !== 0) {
            tabsMeta = null;
            console.error(["MUI: The `value` provided to the Tabs component is invalid.", `The Tab with this \`value\` ("${value}") is not part of the document layout.`, "Make sure the tab item is present in the document or that it's not `display: none`."].join("\n"));
            warnedOnceTabPresent = true;
          }
        }
      }
    }
    return {
      tabsMeta,
      tabMeta
    };
  };
  const updateIndicatorState = useEventCallback_default2(() => {
    const {
      tabsMeta,
      tabMeta
    } = getTabsMeta();
    let startValue = 0;
    let startIndicator;
    if (vertical) {
      startIndicator = "top";
      if (tabMeta && tabsMeta) {
        startValue = tabMeta.top - tabsMeta.top + tabsMeta.scrollTop;
      }
    } else {
      startIndicator = isRtl ? "right" : "left";
      if (tabMeta && tabsMeta) {
        startValue = (isRtl ? -1 : 1) * (tabMeta[startIndicator] - tabsMeta[startIndicator] + tabsMeta.scrollLeft);
      }
    }
    const newIndicatorStyle = {
      [startIndicator]: startValue,
      // May be wrong until the font is loaded.
      [size]: tabMeta ? tabMeta[size] : 0
    };
    if (typeof indicatorStyle[startIndicator] !== "number" || typeof indicatorStyle[size] !== "number") {
      setIndicatorStyle(newIndicatorStyle);
    } else {
      const dStart = Math.abs(indicatorStyle[startIndicator] - newIndicatorStyle[startIndicator]);
      const dSize = Math.abs(indicatorStyle[size] - newIndicatorStyle[size]);
      if (dStart >= 1 || dSize >= 1) {
        setIndicatorStyle(newIndicatorStyle);
      }
    }
  });
  const scroll = (scrollValue, {
    animation = true
  } = {}) => {
    if (animation) {
      animate(scrollStart, tabsRef.current, scrollValue, {
        duration: theme.transitions.duration.standard
      });
    } else {
      tabsRef.current[scrollStart] = scrollValue;
    }
  };
  const moveTabsScroll = (delta) => {
    let scrollValue = tabsRef.current[scrollStart];
    if (vertical) {
      scrollValue += delta;
    } else {
      scrollValue += delta * (isRtl ? -1 : 1);
    }
    scroll(scrollValue);
  };
  const getScrollSize = () => {
    const containerSize = tabsRef.current[clientSize];
    let totalSize = 0;
    const children2 = Array.from(tabListRef.current.children);
    for (let i = 0; i < children2.length; i += 1) {
      const tab = children2[i];
      if (totalSize + tab[clientSize] > containerSize) {
        if (i === 0) {
          totalSize = containerSize;
        }
        break;
      }
      totalSize += tab[clientSize];
    }
    return totalSize;
  };
  const handleStartScrollClick = () => {
    moveTabsScroll(-1 * getScrollSize());
  };
  const handleEndScrollClick = () => {
    moveTabsScroll(getScrollSize());
  };
  const [ScrollbarSlot, {
    onChange: scrollbarOnChange,
    ...scrollbarSlotProps
  }] = useSlot("scrollbar", {
    className: clsx_default(classes.scrollableX, classes.hideScrollbar),
    elementType: TabsScrollbarSize,
    shouldForwardComponentProp: true,
    externalForwardedProps,
    ownerState
  });
  const handleScrollbarSizeChange = React13.useCallback((scrollbarWidth) => {
    scrollbarOnChange?.(scrollbarWidth);
    setScrollerStyle({
      overflow: null,
      scrollbarWidth
    });
  }, [scrollbarOnChange]);
  const [ScrollButtonsSlot, scrollButtonSlotProps] = useSlot("scrollButtons", {
    className: clsx_default(classes.scrollButtons, TabScrollButtonProps.className),
    elementType: TabScrollButton_default,
    externalForwardedProps,
    ownerState,
    additionalProps: {
      orientation,
      slots: {
        StartScrollButtonIcon: slots.startScrollButtonIcon || slots.StartScrollButtonIcon,
        EndScrollButtonIcon: slots.endScrollButtonIcon || slots.EndScrollButtonIcon
      },
      slotProps: {
        startScrollButtonIcon: startScrollButtonIconProps,
        endScrollButtonIcon: endScrollButtonIconProps
      }
    }
  });
  const getConditionalElements = () => {
    const conditionalElements2 = {};
    conditionalElements2.scrollbarSizeListener = scrollable ? (0, import_jsx_runtime10.jsx)(ScrollbarSlot, {
      ...scrollbarSlotProps,
      onChange: handleScrollbarSizeChange
    }) : null;
    const scrollButtonsActive = displayStartScroll || displayEndScroll;
    const showScrollButtons = scrollable && (scrollButtons === "auto" && scrollButtonsActive || scrollButtons === true);
    conditionalElements2.scrollButtonStart = showScrollButtons ? (0, import_jsx_runtime10.jsx)(ScrollButtonsSlot, {
      direction: isRtl ? "right" : "left",
      onClick: handleStartScrollClick,
      disabled: !displayStartScroll,
      ...scrollButtonSlotProps
    }) : null;
    conditionalElements2.scrollButtonEnd = showScrollButtons ? (0, import_jsx_runtime10.jsx)(ScrollButtonsSlot, {
      direction: isRtl ? "left" : "right",
      onClick: handleEndScrollClick,
      disabled: !displayEndScroll,
      ...scrollButtonSlotProps
    }) : null;
    return conditionalElements2;
  };
  const scrollSelectedIntoView = useEventCallback_default2((animation) => {
    const {
      tabsMeta,
      tabMeta
    } = getTabsMeta();
    if (!tabMeta || !tabsMeta) {
      return;
    }
    if (tabMeta[start] < tabsMeta[start]) {
      const nextScrollStart = tabsMeta[scrollStart] + (tabMeta[start] - tabsMeta[start]);
      scroll(nextScrollStart, {
        animation
      });
    } else if (tabMeta[end] > tabsMeta[end]) {
      const nextScrollStart = tabsMeta[scrollStart] + (tabMeta[end] - tabsMeta[end]);
      scroll(nextScrollStart, {
        animation
      });
    }
  });
  const updateScrollButtonState = useEventCallback_default2(() => {
    if (scrollable && scrollButtons !== false) {
      setUpdateScrollObserver(!updateScrollObserver);
    }
  });
  React13.useEffect(() => {
    const handleResize = debounce_default(() => {
      if (tabsRef.current) {
        updateIndicatorState();
      }
    });
    let resizeObserver;
    const handleMutation = (records) => {
      records.forEach((record) => {
        record.removedNodes.forEach((item) => {
          resizeObserver?.unobserve(item);
        });
        record.addedNodes.forEach((item) => {
          resizeObserver?.observe(item);
        });
      });
      handleResize();
      updateScrollButtonState();
    };
    const win = ownerWindow_default(tabsRef.current);
    win.addEventListener("resize", handleResize);
    let mutationObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(handleResize);
      Array.from(tabListRef.current.children).forEach((child) => {
        resizeObserver.observe(child);
      });
    }
    if (typeof MutationObserver !== "undefined") {
      mutationObserver = new MutationObserver(handleMutation);
      mutationObserver.observe(tabListRef.current, {
        childList: true
      });
    }
    return () => {
      handleResize.clear();
      win.removeEventListener("resize", handleResize);
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
    };
  }, [updateIndicatorState, updateScrollButtonState]);
  React13.useEffect(() => {
    const tabListChildren = Array.from(tabListRef.current.children);
    const length = tabListChildren.length;
    if (typeof IntersectionObserver !== "undefined" && length > 0 && scrollable && scrollButtons !== false) {
      const firstTab = tabListChildren[0];
      const lastTab = tabListChildren[length - 1];
      const observerOptions = {
        root: tabsRef.current,
        threshold: 0.99
      };
      const handleScrollButtonStart = (entries) => {
        setDisplayStartScroll(!entries[0].isIntersecting);
      };
      const firstObserver = new IntersectionObserver(handleScrollButtonStart, observerOptions);
      firstObserver.observe(firstTab);
      const handleScrollButtonEnd = (entries) => {
        setDisplayEndScroll(!entries[0].isIntersecting);
      };
      const lastObserver = new IntersectionObserver(handleScrollButtonEnd, observerOptions);
      lastObserver.observe(lastTab);
      return () => {
        firstObserver.disconnect();
        lastObserver.disconnect();
      };
    }
    return void 0;
  }, [scrollable, scrollButtons, updateScrollObserver, childrenProp?.length]);
  React13.useEffect(() => {
    setMounted(true);
  }, []);
  React13.useEffect(() => {
    updateIndicatorState();
  });
  React13.useEffect(() => {
    scrollSelectedIntoView(defaultIndicatorStyle !== indicatorStyle);
  }, [scrollSelectedIntoView, indicatorStyle]);
  React13.useImperativeHandle(action, () => ({
    updateIndicator: updateIndicatorState,
    updateScrollButtons: updateScrollButtonState
  }), [updateIndicatorState, updateScrollButtonState]);
  const [IndicatorSlot, indicatorSlotProps] = useSlot("indicator", {
    className: clsx_default(classes.indicator, TabIndicatorProps.className),
    elementType: TabsIndicator,
    externalForwardedProps,
    ownerState,
    additionalProps: {
      style: indicatorStyle
    }
  });
  const indicator = (0, import_jsx_runtime10.jsx)(IndicatorSlot, {
    ...indicatorSlotProps
  });
  let childIndex = 0;
  const children = React13.Children.map(childrenProp, (child) => {
    if (!React13.isValidElement(child)) {
      return null;
    }
    if (true) {
      if ((0, import_react_is.isFragment)(child)) {
        console.error(["MUI: The Tabs component doesn't accept a Fragment as a child.", "Consider providing an array instead."].join("\n"));
      }
    }
    const childValue = child.props.value === void 0 ? childIndex : child.props.value;
    valueToIndex.set(childValue, childIndex);
    const selected = childValue === value;
    childIndex += 1;
    return React13.cloneElement(child, {
      fullWidth: variant === "fullWidth",
      indicator: selected && !mounted && indicator,
      selected,
      selectionFollowsFocus,
      onChange,
      textColor,
      value: childValue,
      ...childIndex === 1 && value === false && !child.props.tabIndex ? {
        tabIndex: 0
      } : {}
    });
  });
  const handleKeyDown = (event) => {
    if (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const list = tabListRef.current;
    const currentFocus = ownerDocument_default(list).activeElement;
    const role = currentFocus.getAttribute("role");
    if (role !== "tab") {
      return;
    }
    let previousItemKey = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
    let nextItemKey = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
    if (orientation === "horizontal" && isRtl) {
      previousItemKey = "ArrowRight";
      nextItemKey = "ArrowLeft";
    }
    switch (event.key) {
      case previousItemKey:
        event.preventDefault();
        moveFocus(list, currentFocus, previousItem);
        break;
      case nextItemKey:
        event.preventDefault();
        moveFocus(list, currentFocus, nextItem);
        break;
      case "Home":
        event.preventDefault();
        moveFocus(list, null, nextItem);
        break;
      case "End":
        event.preventDefault();
        moveFocus(list, null, previousItem);
        break;
      default:
        break;
    }
  };
  const conditionalElements = getConditionalElements();
  const [RootSlot, rootSlotProps] = useSlot("root", {
    ref,
    className: clsx_default(classes.root, className),
    elementType: TabsRoot,
    externalForwardedProps: {
      ...externalForwardedProps,
      ...other,
      component
    },
    ownerState
  });
  const [ScrollerSlot, scrollerSlotProps] = useSlot("scroller", {
    ref: tabsRef,
    className: classes.scroller,
    elementType: TabsScroller,
    externalForwardedProps,
    ownerState,
    additionalProps: {
      style: {
        overflow: scrollerStyle.overflow,
        [vertical ? `margin${isRtl ? "Left" : "Right"}` : "marginBottom"]: visibleScrollbar ? void 0 : -scrollerStyle.scrollbarWidth
      }
    }
  });
  const [ListSlot, listSlotProps] = useSlot("list", {
    ref: tabListRef,
    className: clsx_default(classes.list, classes.flexContainer),
    elementType: List,
    externalForwardedProps,
    ownerState,
    getSlotProps: (handlers) => ({
      ...handlers,
      onKeyDown: (event) => {
        handleKeyDown(event);
        handlers.onKeyDown?.(event);
      }
    })
  });
  return (0, import_jsx_runtime10.jsxs)(RootSlot, {
    ...rootSlotProps,
    children: [conditionalElements.scrollButtonStart, conditionalElements.scrollbarSizeListener, (0, import_jsx_runtime10.jsxs)(ScrollerSlot, {
      ...scrollerSlotProps,
      children: [(0, import_jsx_runtime10.jsx)(ListSlot, {
        "aria-label": ariaLabel,
        "aria-labelledby": ariaLabelledBy,
        "aria-orientation": orientation === "vertical" ? "vertical" : null,
        role: "tablist",
        ...listSlotProps,
        children
      }), mounted && indicator]
    }), conditionalElements.scrollButtonEnd]
  });
});
true ? Tabs.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Callback fired when the component mounts.
   * This is useful when you want to trigger an action programmatically.
   * It supports two actions: `updateIndicator()` and `updateScrollButtons()`
   *
   * @param {object} actions This object contains all possible actions
   * that can be triggered programmatically.
   */
  action: refType_default,
  /**
   * If `true`, the scroll buttons aren't forced hidden on mobile.
   * By default the scroll buttons are hidden on mobile and takes precedence over `scrollButtons`.
   * @default false
   */
  allowScrollButtonsMobile: import_prop_types8.default.bool,
  /**
   * The label for the Tabs as a string.
   */
  "aria-label": import_prop_types8.default.string,
  /**
   * An id or list of ids separated by a space that label the Tabs.
   */
  "aria-labelledby": import_prop_types8.default.string,
  /**
   * If `true`, the tabs are centered.
   * This prop is intended for large views.
   * @default false
   */
  centered: import_prop_types8.default.bool,
  /**
   * The content of the component.
   */
  children: import_prop_types8.default.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: import_prop_types8.default.object,
  /**
   * @ignore
   */
  className: import_prop_types8.default.string,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: import_prop_types8.default.elementType,
  /**
   * Determines the color of the indicator.
   * @default 'primary'
   */
  indicatorColor: import_prop_types8.default.oneOfType([import_prop_types8.default.oneOf(["primary", "secondary"]), import_prop_types8.default.string]),
  /**
   * Callback fired when the value changes.
   *
   * @param {React.SyntheticEvent} event The event source of the callback. **Warning**: This is a generic event not a change event.
   * @param {any} value We default to the index of the child (number)
   */
  onChange: import_prop_types8.default.func,
  /**
   * The component orientation (layout flow direction).
   * @default 'horizontal'
   */
  orientation: import_prop_types8.default.oneOf(["horizontal", "vertical"]),
  /**
   * The component used to render the scroll buttons.
   * @deprecated use the `slots.scrollButtons` prop instead. This prop will be removed in a future major release. See [Migrating from deprecated APIs](https://mui.com/material-ui/migration/migrating-from-deprecated-apis/) for more details.
   * @default TabScrollButton
   */
  ScrollButtonComponent: import_prop_types8.default.elementType,
  /**
   * Determine behavior of scroll buttons when tabs are set to scroll:
   *
   * - `auto` will only present them when not all the items are visible.
   * - `true` will always present them.
   * - `false` will never present them.
   *
   * By default the scroll buttons are hidden on mobile.
   * This behavior can be disabled with `allowScrollButtonsMobile`.
   * @default 'auto'
   */
  scrollButtons: import_prop_types8.default.oneOf(["auto", false, true]),
  /**
   * If `true` the selected tab changes on focus. Otherwise it only
   * changes on activation.
   */
  selectionFollowsFocus: import_prop_types8.default.bool,
  /**
   * The props used for each slot inside.
   * @default {}
   */
  slotProps: import_prop_types8.default.shape({
    endScrollButtonIcon: import_prop_types8.default.oneOfType([import_prop_types8.default.func, import_prop_types8.default.object]),
    indicator: import_prop_types8.default.oneOfType([import_prop_types8.default.func, import_prop_types8.default.object]),
    list: import_prop_types8.default.oneOfType([import_prop_types8.default.func, import_prop_types8.default.object]),
    root: import_prop_types8.default.oneOfType([import_prop_types8.default.func, import_prop_types8.default.object]),
    scrollbar: import_prop_types8.default.oneOfType([import_prop_types8.default.func, import_prop_types8.default.object]),
    scrollButtons: import_prop_types8.default.oneOfType([import_prop_types8.default.func, import_prop_types8.default.object]),
    scroller: import_prop_types8.default.oneOfType([import_prop_types8.default.func, import_prop_types8.default.object]),
    startScrollButtonIcon: import_prop_types8.default.oneOfType([import_prop_types8.default.func, import_prop_types8.default.object])
  }),
  /**
   * The components used for each slot inside.
   * @default {}
   */
  slots: import_prop_types8.default.shape({
    endScrollButtonIcon: import_prop_types8.default.elementType,
    EndScrollButtonIcon: import_prop_types8.default.elementType,
    indicator: import_prop_types8.default.elementType,
    list: import_prop_types8.default.elementType,
    root: import_prop_types8.default.elementType,
    scrollbar: import_prop_types8.default.elementType,
    scrollButtons: import_prop_types8.default.elementType,
    scroller: import_prop_types8.default.elementType,
    startScrollButtonIcon: import_prop_types8.default.elementType,
    StartScrollButtonIcon: import_prop_types8.default.elementType
  }),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: import_prop_types8.default.oneOfType([import_prop_types8.default.arrayOf(import_prop_types8.default.oneOfType([import_prop_types8.default.func, import_prop_types8.default.object, import_prop_types8.default.bool])), import_prop_types8.default.func, import_prop_types8.default.object]),
  /**
   * Props applied to the tab indicator element.
   * @deprecated use the `slotProps.indicator` prop instead. This prop will be removed in a future major release. See [Migrating from deprecated APIs](https://mui.com/material-ui/migration/migrating-from-deprecated-apis/) for more details.
   * @default  {}
   */
  TabIndicatorProps: import_prop_types8.default.object,
  /**
   * Props applied to the [`TabScrollButton`](https://mui.com/material-ui/api/tab-scroll-button/) element.
   * @deprecated use the `slotProps.scrollButtons` prop instead. This prop will be removed in a future major release. See [Migrating from deprecated APIs](https://mui.com/material-ui/migration/migrating-from-deprecated-apis/) for more details.
   * @default {}
   */
  TabScrollButtonProps: import_prop_types8.default.object,
  /**
   * Determines the color of the `Tab`.
   * @default 'primary'
   */
  textColor: import_prop_types8.default.oneOf(["inherit", "primary", "secondary"]),
  /**
   * The value of the currently selected `Tab`.
   * If you don't want any selected `Tab`, you can set this prop to `false`.
   */
  value: import_prop_types8.default.any,
  /**
   * Determines additional display behavior of the tabs:
   *
   *  - `scrollable` will invoke scrolling properties and allow for horizontally
   *  scrolling (or swiping) of the tab bar.
   *  - `fullWidth` will make the tabs grow to use all the available space,
   *  which should be used for small views, like on mobile.
   *  - `standard` will render the default state.
   * @default 'standard'
   */
  variant: import_prop_types8.default.oneOf(["fullWidth", "scrollable", "standard"]),
  /**
   * If `true`, the scrollbar is visible. It can be useful when displaying
   * a long vertical list of tabs.
   * @default false
   */
  visibleScrollbar: import_prop_types8.default.bool
} : void 0;
var Tabs_default = Tabs;

// node_modules/@mui/material/esm/Typography/typographyClasses.js
function getTypographyUtilityClass(slot) {
  return generateUtilityClass("MuiTypography", slot);
}
var typographyClasses = generateUtilityClasses("MuiTypography", ["root", "h1", "h2", "h3", "h4", "h5", "h6", "subtitle1", "subtitle2", "body1", "body2", "inherit", "button", "caption", "overline", "alignLeft", "alignRight", "alignCenter", "alignJustify", "noWrap", "gutterBottom", "paragraph"]);
var typographyClasses_default = typographyClasses;

// node_modules/@mui/material/esm/Typography/Typography.js
var React14 = __toESM(require_react(), 1);
var import_prop_types9 = __toESM(require_prop_types(), 1);
var import_jsx_runtime11 = __toESM(require_jsx_runtime(), 1);
var v6Colors = {
  primary: true,
  secondary: true,
  error: true,
  info: true,
  success: true,
  warning: true,
  textPrimary: true,
  textSecondary: true,
  textDisabled: true
};
var extendSxProp = internal_createExtendSxProp();
var useUtilityClasses6 = (ownerState) => {
  const {
    align,
    gutterBottom,
    noWrap,
    paragraph,
    variant,
    classes
  } = ownerState;
  const slots = {
    root: ["root", variant, ownerState.align !== "inherit" && `align${capitalize_default(align)}`, gutterBottom && "gutterBottom", noWrap && "noWrap", paragraph && "paragraph"]
  };
  return composeClasses(slots, getTypographyUtilityClass, classes);
};
var TypographyRoot = styled_default("span", {
  name: "MuiTypography",
  slot: "Root",
  overridesResolver: (props, styles2) => {
    const {
      ownerState
    } = props;
    return [styles2.root, ownerState.variant && styles2[ownerState.variant], ownerState.align !== "inherit" && styles2[`align${capitalize_default(ownerState.align)}`], ownerState.noWrap && styles2.noWrap, ownerState.gutterBottom && styles2.gutterBottom, ownerState.paragraph && styles2.paragraph];
  }
})(memoTheme_default(({
  theme
}) => ({
  margin: 0,
  variants: [{
    props: {
      variant: "inherit"
    },
    style: {
      // Some elements, like <button> on Chrome have default font that doesn't inherit, reset this.
      font: "inherit",
      lineHeight: "inherit",
      letterSpacing: "inherit"
    }
  }, ...Object.entries(theme.typography).filter(([variant, value]) => variant !== "inherit" && value && typeof value === "object").map(([variant, value]) => ({
    props: {
      variant
    },
    style: value
  })), ...Object.entries(theme.palette).filter(createSimplePaletteValueFilter()).map(([color]) => ({
    props: {
      color
    },
    style: {
      color: (theme.vars || theme).palette[color].main
    }
  })), ...Object.entries(theme.palette?.text || {}).filter(([, value]) => typeof value === "string").map(([color]) => ({
    props: {
      color: `text${capitalize_default(color)}`
    },
    style: {
      color: (theme.vars || theme).palette.text[color]
    }
  })), {
    props: ({
      ownerState
    }) => ownerState.align !== "inherit",
    style: {
      textAlign: "var(--Typography-textAlign)"
    }
  }, {
    props: ({
      ownerState
    }) => ownerState.noWrap,
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, {
    props: ({
      ownerState
    }) => ownerState.gutterBottom,
    style: {
      marginBottom: "0.35em"
    }
  }, {
    props: ({
      ownerState
    }) => ownerState.paragraph,
    style: {
      marginBottom: 16
    }
  }]
})));
var defaultVariantMapping = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  subtitle1: "h6",
  subtitle2: "h6",
  body1: "p",
  body2: "p",
  inherit: "p"
};
var Typography = React14.forwardRef(function Typography2(inProps, ref) {
  const {
    color,
    ...themeProps
  } = useDefaultProps({
    props: inProps,
    name: "MuiTypography"
  });
  const isSxColor = !v6Colors[color];
  const props = extendSxProp({
    ...themeProps,
    ...isSxColor && {
      color
    }
  });
  const {
    align = "inherit",
    className,
    component,
    gutterBottom = false,
    noWrap = false,
    paragraph = false,
    variant = "body1",
    variantMapping = defaultVariantMapping,
    ...other
  } = props;
  const ownerState = {
    ...props,
    align,
    color,
    className,
    component,
    gutterBottom,
    noWrap,
    paragraph,
    variant,
    variantMapping
  };
  const Component = component || (paragraph ? "p" : variantMapping[variant] || defaultVariantMapping[variant]) || "span";
  const classes = useUtilityClasses6(ownerState);
  return (0, import_jsx_runtime11.jsx)(TypographyRoot, {
    as: Component,
    ref,
    className: clsx_default(classes.root, className),
    ...other,
    ownerState,
    style: {
      ...align !== "inherit" && {
        "--Typography-textAlign": align
      },
      ...other.style
    }
  });
});
true ? Typography.propTypes = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Set the text-align on the component.
   * @default 'inherit'
   */
  align: import_prop_types9.default.oneOf(["center", "inherit", "justify", "left", "right"]),
  /**
   * The content of the component.
   */
  children: import_prop_types9.default.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: import_prop_types9.default.object,
  /**
   * @ignore
   */
  className: import_prop_types9.default.string,
  /**
   * The color of the component.
   * It supports both default and custom theme colors, which can be added as shown in the
   * [palette customization guide](https://mui.com/material-ui/customization/palette/#custom-colors).
   */
  color: import_prop_types9.default.oneOfType([import_prop_types9.default.oneOf(["primary", "secondary", "success", "error", "info", "warning", "textPrimary", "textSecondary", "textDisabled"]), import_prop_types9.default.string]),
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: import_prop_types9.default.elementType,
  /**
   * If `true`, the text will have a bottom margin.
   * @default false
   */
  gutterBottom: import_prop_types9.default.bool,
  /**
   * If `true`, the text will not wrap, but instead will truncate with a text overflow ellipsis.
   *
   * Note that text overflow can only happen with block or inline-block level elements
   * (the element needs to have a width in order to overflow).
   * @default false
   */
  noWrap: import_prop_types9.default.bool,
  /**
   * If `true`, the element will be a paragraph element.
   * @default false
   * @deprecated Use the `component` prop instead. This prop will be removed in a future major release. See [Migrating from deprecated APIs](https://mui.com/material-ui/migration/migrating-from-deprecated-apis/) for more details.
   */
  paragraph: import_prop_types9.default.bool,
  /**
   * @ignore
   */
  style: import_prop_types9.default.object,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: import_prop_types9.default.oneOfType([import_prop_types9.default.arrayOf(import_prop_types9.default.oneOfType([import_prop_types9.default.func, import_prop_types9.default.object, import_prop_types9.default.bool])), import_prop_types9.default.func, import_prop_types9.default.object]),
  /**
   * Applies the theme typography styles.
   * @default 'body1'
   */
  variant: import_prop_types9.default.oneOfType([import_prop_types9.default.oneOf(["body1", "body2", "button", "caption", "h1", "h2", "h3", "h4", "h5", "h6", "inherit", "overline", "subtitle1", "subtitle2"]), import_prop_types9.default.string]),
  /**
   * The component maps the variant prop to a range of different HTML element types.
   * For instance, subtitle1 to `<h6>`.
   * If you wish to change that mapping, you can provide your own.
   * Alternatively, you can use the `component` prop.
   * @default {
   *   h1: 'h1',
   *   h2: 'h2',
   *   h3: 'h3',
   *   h4: 'h4',
   *   h5: 'h5',
   *   h6: 'h6',
   *   subtitle1: 'h6',
   *   subtitle2: 'h6',
   *   body1: 'p',
   *   body2: 'p',
   *   inherit: 'p',
   * }
   */
  variantMapping: import_prop_types9.default.object
} : void 0;
var Typography_default = Typography;

// node_modules/@mui/material/esm/useAutocomplete/useAutocomplete.js
var React16 = __toESM(require_react(), 1);

// node_modules/@mui/utils/esm/usePreviousProps/usePreviousProps.js
var React15 = __toESM(require_react(), 1);
var usePreviousProps = (value) => {
  const ref = React15.useRef({});
  React15.useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};
var usePreviousProps_default = usePreviousProps;

// node_modules/@mui/material/esm/useAutocomplete/useAutocomplete.js
function stripDiacritics(string) {
  return string.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function createFilterOptions(config = {}) {
  const {
    ignoreAccents = true,
    ignoreCase = true,
    limit,
    matchFrom = "any",
    stringify,
    trim = false
  } = config;
  return (options, {
    inputValue,
    getOptionLabel
  }) => {
    let input = trim ? inputValue.trim() : inputValue;
    if (ignoreCase) {
      input = input.toLowerCase();
    }
    if (ignoreAccents) {
      input = stripDiacritics(input);
    }
    const filteredOptions = !input ? options : options.filter((option) => {
      let candidate = (stringify || getOptionLabel)(option);
      if (ignoreCase) {
        candidate = candidate.toLowerCase();
      }
      if (ignoreAccents) {
        candidate = stripDiacritics(candidate);
      }
      return matchFrom === "start" ? candidate.startsWith(input) : candidate.includes(input);
    });
    return typeof limit === "number" ? filteredOptions.slice(0, limit) : filteredOptions;
  };
}
var defaultFilterOptions = createFilterOptions();
var pageSize = 5;
var defaultIsActiveElementInListbox = (listboxRef) => listboxRef.current !== null && listboxRef.current.parentElement?.contains(document.activeElement);
var MULTIPLE_DEFAULT_VALUE = [];
function getInputValue(value, multiple, getOptionLabel, renderValue) {
  if (multiple || value == null || renderValue) {
    return "";
  }
  const optionLabel = getOptionLabel(value);
  return typeof optionLabel === "string" ? optionLabel : "";
}
function useAutocomplete(props) {
  const {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    unstable_isActiveElementInListbox = defaultIsActiveElementInListbox,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    unstable_classNamePrefix = "Mui",
    autoComplete = false,
    autoHighlight = false,
    autoSelect = false,
    blurOnSelect = false,
    clearOnBlur = !props.freeSolo,
    clearOnEscape = false,
    componentName = "useAutocomplete",
    defaultValue = props.multiple ? MULTIPLE_DEFAULT_VALUE : null,
    disableClearable = false,
    disableCloseOnSelect = false,
    disabled: disabledProp,
    disabledItemsFocusable = false,
    disableListWrap = false,
    filterOptions = defaultFilterOptions,
    filterSelectedOptions = false,
    freeSolo = false,
    getOptionDisabled,
    getOptionKey,
    getOptionLabel: getOptionLabelProp = (option) => option.label ?? option,
    groupBy,
    handleHomeEndKeys = !props.freeSolo,
    id: idProp,
    includeInputInList = false,
    inputValue: inputValueProp,
    isOptionEqualToValue = (option, value2) => option === value2,
    multiple = false,
    onChange,
    onClose,
    onHighlightChange,
    onInputChange,
    onOpen,
    open: openProp,
    openOnFocus = false,
    options,
    readOnly = false,
    renderValue,
    selectOnFocus = !props.freeSolo,
    value: valueProp
  } = props;
  const id = useId(idProp);
  let getOptionLabel = getOptionLabelProp;
  getOptionLabel = (option) => {
    const optionLabel = getOptionLabelProp(option);
    if (typeof optionLabel !== "string") {
      if (true) {
        const erroneousReturn = optionLabel === void 0 ? "undefined" : `${typeof optionLabel} (${optionLabel})`;
        console.error(`MUI: The \`getOptionLabel\` method of ${componentName} returned ${erroneousReturn} instead of a string for ${JSON.stringify(option)}.`);
      }
      return String(optionLabel);
    }
    return optionLabel;
  };
  const ignoreFocus = React16.useRef(false);
  const firstFocus = React16.useRef(true);
  const inputRef = React16.useRef(null);
  const listboxRef = React16.useRef(null);
  const [anchorEl, setAnchorEl] = React16.useState(null);
  const [focusedItem, setFocusedItem] = React16.useState(-1);
  const defaultHighlighted = autoHighlight ? 0 : -1;
  const highlightedIndexRef = React16.useRef(defaultHighlighted);
  const initialInputValue = React16.useRef(getInputValue(defaultValue ?? valueProp, multiple, getOptionLabel)).current;
  const [value, setValueState] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: componentName
  });
  const [inputValue, setInputValueState] = useControlled({
    controlled: inputValueProp,
    default: initialInputValue,
    name: componentName,
    state: "inputValue"
  });
  const [focused, setFocused] = React16.useState(false);
  const resetInputValue = React16.useCallback((event, newValue, reason) => {
    const isOptionSelected = multiple ? value.length < newValue.length : newValue !== null;
    if (!isOptionSelected && !clearOnBlur) {
      return;
    }
    const newInputValue = getInputValue(newValue, multiple, getOptionLabel, renderValue);
    if (inputValue === newInputValue) {
      return;
    }
    setInputValueState(newInputValue);
    if (onInputChange) {
      onInputChange(event, newInputValue, reason);
    }
  }, [getOptionLabel, inputValue, multiple, onInputChange, setInputValueState, clearOnBlur, value, renderValue]);
  const [open, setOpenState] = useControlled({
    controlled: openProp,
    default: false,
    name: componentName,
    state: "open"
  });
  const [inputPristine, setInputPristine] = React16.useState(true);
  const inputValueIsSelectedValue = !multiple && value != null && inputValue === getOptionLabel(value);
  const popupOpen = open && !readOnly;
  const filteredOptions = popupOpen ? filterOptions(
    options.filter((option) => {
      if (filterSelectedOptions && (multiple ? value : [value]).some((value2) => value2 !== null && isOptionEqualToValue(option, value2))) {
        return false;
      }
      return true;
    }),
    // we use the empty string to manipulate `filterOptions` to not filter any options
    // i.e. the filter predicate always returns true
    {
      inputValue: inputValueIsSelectedValue && inputPristine ? "" : inputValue,
      getOptionLabel
    }
  ) : [];
  const previousProps = usePreviousProps_default({
    filteredOptions,
    value,
    inputValue
  });
  React16.useEffect(() => {
    const valueChange = value !== previousProps.value;
    if (focused && !valueChange) {
      return;
    }
    if (freeSolo && !valueChange) {
      return;
    }
    resetInputValue(null, value, "reset");
  }, [value, resetInputValue, focused, previousProps.value, freeSolo]);
  const listboxAvailable = open && filteredOptions.length > 0 && !readOnly;
  const focusItem = useEventCallback_default((itemToFocus) => {
    if (itemToFocus === -1) {
      inputRef.current.focus();
    } else {
      const indexType = renderValue ? "data-item-index" : "data-tag-index";
      anchorEl.querySelector(`[${indexType}="${itemToFocus}"]`).focus();
    }
  });
  React16.useEffect(() => {
    if (multiple && focusedItem > value.length - 1) {
      setFocusedItem(-1);
      focusItem(-1);
    }
  }, [value, multiple, focusedItem, focusItem]);
  function validOptionIndex(index, direction) {
    if (!listboxRef.current || index < 0 || index >= filteredOptions.length) {
      return -1;
    }
    let nextFocus = index;
    while (true) {
      const option = listboxRef.current.querySelector(`[data-option-index="${nextFocus}"]`);
      const nextFocusDisabled = disabledItemsFocusable ? false : !option || option.disabled || option.getAttribute("aria-disabled") === "true";
      if (option && option.hasAttribute("tabindex") && !nextFocusDisabled) {
        return nextFocus;
      }
      if (direction === "next") {
        nextFocus = (nextFocus + 1) % filteredOptions.length;
      } else {
        nextFocus = (nextFocus - 1 + filteredOptions.length) % filteredOptions.length;
      }
      if (nextFocus === index) {
        return -1;
      }
    }
  }
  const setHighlightedIndex = useEventCallback_default(({
    event,
    index,
    reason
  }) => {
    highlightedIndexRef.current = index;
    if (index === -1) {
      inputRef.current.removeAttribute("aria-activedescendant");
    } else {
      inputRef.current.setAttribute("aria-activedescendant", `${id}-option-${index}`);
    }
    if (onHighlightChange && ["mouse", "keyboard", "touch"].includes(reason)) {
      onHighlightChange(event, index === -1 ? null : filteredOptions[index], reason);
    }
    if (!listboxRef.current) {
      return;
    }
    const prev = listboxRef.current.querySelector(`[role="option"].${unstable_classNamePrefix}-focused`);
    if (prev) {
      prev.classList.remove(`${unstable_classNamePrefix}-focused`);
      prev.classList.remove(`${unstable_classNamePrefix}-focusVisible`);
    }
    let listboxNode = listboxRef.current;
    if (listboxRef.current.getAttribute("role") !== "listbox") {
      listboxNode = listboxRef.current.parentElement.querySelector('[role="listbox"]');
    }
    if (!listboxNode) {
      return;
    }
    if (index === -1) {
      listboxNode.scrollTop = 0;
      return;
    }
    const option = listboxRef.current.querySelector(`[data-option-index="${index}"]`);
    if (!option) {
      return;
    }
    option.classList.add(`${unstable_classNamePrefix}-focused`);
    if (reason === "keyboard") {
      option.classList.add(`${unstable_classNamePrefix}-focusVisible`);
    }
    if (listboxNode.scrollHeight > listboxNode.clientHeight && reason !== "mouse" && reason !== "touch") {
      const element = option;
      const scrollBottom = listboxNode.clientHeight + listboxNode.scrollTop;
      const elementBottom = element.offsetTop + element.offsetHeight;
      if (elementBottom > scrollBottom) {
        listboxNode.scrollTop = elementBottom - listboxNode.clientHeight;
      } else if (element.offsetTop - element.offsetHeight * (groupBy ? 1.3 : 0) < listboxNode.scrollTop) {
        listboxNode.scrollTop = element.offsetTop - element.offsetHeight * (groupBy ? 1.3 : 0);
      }
    }
  });
  const changeHighlightedIndex = useEventCallback_default(({
    event,
    diff,
    direction = "next",
    reason
  }) => {
    if (!popupOpen) {
      return;
    }
    const getNextIndex = () => {
      const maxIndex = filteredOptions.length - 1;
      if (diff === "reset") {
        return defaultHighlighted;
      }
      if (diff === "start") {
        return 0;
      }
      if (diff === "end") {
        return maxIndex;
      }
      const newIndex = highlightedIndexRef.current + diff;
      if (newIndex < 0) {
        if (newIndex === -1 && includeInputInList) {
          return -1;
        }
        if (disableListWrap && highlightedIndexRef.current !== -1 || Math.abs(diff) > 1) {
          return 0;
        }
        return maxIndex;
      }
      if (newIndex > maxIndex) {
        if (newIndex === maxIndex + 1 && includeInputInList) {
          return -1;
        }
        if (disableListWrap || Math.abs(diff) > 1) {
          return maxIndex;
        }
        return 0;
      }
      return newIndex;
    };
    const nextIndex = validOptionIndex(getNextIndex(), direction);
    setHighlightedIndex({
      index: nextIndex,
      reason,
      event
    });
    if (autoComplete && diff !== "reset") {
      if (nextIndex === -1) {
        inputRef.current.value = inputValue;
      } else {
        const option = getOptionLabel(filteredOptions[nextIndex]);
        inputRef.current.value = option;
        const index = option.toLowerCase().indexOf(inputValue.toLowerCase());
        if (index === 0 && inputValue.length > 0) {
          inputRef.current.setSelectionRange(inputValue.length, option.length);
        }
      }
    }
  });
  const getPreviousHighlightedOptionIndex = () => {
    const isSameValue = (value1, value2) => {
      const label1 = value1 ? getOptionLabel(value1) : "";
      const label2 = value2 ? getOptionLabel(value2) : "";
      return label1 === label2;
    };
    if (highlightedIndexRef.current !== -1 && previousProps.filteredOptions && previousProps.filteredOptions.length !== filteredOptions.length && previousProps.inputValue === inputValue && (multiple ? value.length === previousProps.value.length && previousProps.value.every((val, i) => getOptionLabel(value[i]) === getOptionLabel(val)) : isSameValue(previousProps.value, value))) {
      const previousHighlightedOption = previousProps.filteredOptions[highlightedIndexRef.current];
      if (previousHighlightedOption) {
        return filteredOptions.findIndex((option) => {
          return getOptionLabel(option) === getOptionLabel(previousHighlightedOption);
        });
      }
    }
    return -1;
  };
  const syncHighlightedIndex = React16.useCallback(() => {
    if (!popupOpen) {
      return;
    }
    const previousHighlightedOptionIndex = getPreviousHighlightedOptionIndex();
    if (previousHighlightedOptionIndex !== -1) {
      highlightedIndexRef.current = previousHighlightedOptionIndex;
      return;
    }
    const valueItem = multiple ? value[0] : value;
    if (filteredOptions.length === 0 || valueItem == null) {
      changeHighlightedIndex({
        diff: "reset"
      });
      return;
    }
    if (!listboxRef.current) {
      return;
    }
    if (valueItem != null) {
      const currentOption = filteredOptions[highlightedIndexRef.current];
      if (multiple && currentOption && value.findIndex((val) => isOptionEqualToValue(currentOption, val)) !== -1) {
        return;
      }
      const itemIndex = filteredOptions.findIndex((optionItem) => isOptionEqualToValue(optionItem, valueItem));
      if (itemIndex === -1) {
        changeHighlightedIndex({
          diff: "reset"
        });
      } else {
        setHighlightedIndex({
          index: itemIndex
        });
      }
      return;
    }
    if (highlightedIndexRef.current >= filteredOptions.length - 1) {
      setHighlightedIndex({
        index: filteredOptions.length - 1
      });
      return;
    }
    setHighlightedIndex({
      index: highlightedIndexRef.current
    });
  }, [
    // Only sync the highlighted index when the option switch between empty and not
    filteredOptions.length,
    // Don't sync the highlighted index with the value when multiple
    // eslint-disable-next-line react-hooks/exhaustive-deps
    multiple ? false : value,
    filterSelectedOptions,
    changeHighlightedIndex,
    setHighlightedIndex,
    popupOpen,
    inputValue,
    multiple
  ]);
  const handleListboxRef = useEventCallback_default((node) => {
    setRef(listboxRef, node);
    if (!node) {
      return;
    }
    syncHighlightedIndex();
  });
  if (true) {
    React16.useEffect(() => {
      if (!inputRef.current || inputRef.current.nodeName !== "INPUT") {
        if (inputRef.current && inputRef.current.nodeName === "TEXTAREA") {
          console.warn([`A textarea element was provided to ${componentName} where input was expected.`, `This is not a supported scenario but it may work under certain conditions.`, `A textarea keyboard navigation may conflict with Autocomplete controls (for example enter and arrow keys).`, `Make sure to test keyboard navigation and add custom event handlers if necessary.`].join("\n"));
        } else {
          console.error([`MUI: Unable to find the input element. It was resolved to ${inputRef.current} while an HTMLInputElement was expected.`, `Instead, ${componentName} expects an input element.`, "", componentName === "useAutocomplete" ? "Make sure you have bound getInputProps correctly and that the normal ref/effect resolutions order is guaranteed." : "Make sure you have customized the input component correctly."].join("\n"));
        }
      }
    }, [componentName]);
  }
  React16.useEffect(() => {
    syncHighlightedIndex();
  }, [syncHighlightedIndex]);
  const handleOpen = (event) => {
    if (open) {
      return;
    }
    setOpenState(true);
    setInputPristine(true);
    if (onOpen) {
      onOpen(event);
    }
  };
  const handleClose = (event, reason) => {
    if (!open) {
      return;
    }
    setOpenState(false);
    if (onClose) {
      onClose(event, reason);
    }
  };
  const handleValue = (event, newValue, reason, details) => {
    if (multiple) {
      if (value.length === newValue.length && value.every((val, i) => val === newValue[i])) {
        return;
      }
    } else if (value === newValue) {
      return;
    }
    if (onChange) {
      onChange(event, newValue, reason, details);
    }
    setValueState(newValue);
  };
  const isTouch = React16.useRef(false);
  const selectNewValue = (event, option, reasonProp = "selectOption", origin = "options") => {
    let reason = reasonProp;
    let newValue = option;
    if (multiple) {
      newValue = Array.isArray(value) ? value.slice() : [];
      if (true) {
        const matches = newValue.filter((val) => isOptionEqualToValue(option, val));
        if (matches.length > 1) {
          console.error([`MUI: The \`isOptionEqualToValue\` method of ${componentName} does not handle the arguments correctly.`, `The component expects a single value to match a given option but found ${matches.length} matches.`].join("\n"));
        }
      }
      const itemIndex = newValue.findIndex((valueItem) => isOptionEqualToValue(option, valueItem));
      if (itemIndex === -1) {
        newValue.push(option);
      } else if (origin !== "freeSolo") {
        newValue.splice(itemIndex, 1);
        reason = "removeOption";
      }
    }
    resetInputValue(event, newValue, reason);
    handleValue(event, newValue, reason, {
      option
    });
    if (!disableCloseOnSelect && (!event || !event.ctrlKey && !event.metaKey)) {
      handleClose(event, reason);
    }
    if (blurOnSelect === true || blurOnSelect === "touch" && isTouch.current || blurOnSelect === "mouse" && !isTouch.current) {
      inputRef.current.blur();
    }
  };
  function validItemIndex(index, direction) {
    if (index === -1) {
      return -1;
    }
    let nextFocus = index;
    while (true) {
      if (direction === "next" && nextFocus === value.length || direction === "previous" && nextFocus === -1) {
        return -1;
      }
      const indexType = renderValue ? "data-item-index" : "data-tag-index";
      const option = anchorEl.querySelector(`[${indexType}="${nextFocus}"]`);
      if (!option || !option.hasAttribute("tabindex") || option.disabled || option.getAttribute("aria-disabled") === "true") {
        nextFocus += direction === "next" ? 1 : -1;
      } else {
        return nextFocus;
      }
    }
  }
  const handleFocusItem = (event, direction) => {
    if (!multiple) {
      return;
    }
    if (inputValue === "") {
      handleClose(event, "toggleInput");
    }
    let nextItem2 = focusedItem;
    if (focusedItem === -1) {
      if (inputValue === "" && direction === "previous") {
        nextItem2 = value.length - 1;
      }
    } else {
      nextItem2 += direction === "next" ? 1 : -1;
      if (nextItem2 < 0) {
        nextItem2 = 0;
      }
      if (nextItem2 === value.length) {
        nextItem2 = -1;
      }
    }
    nextItem2 = validItemIndex(nextItem2, direction);
    setFocusedItem(nextItem2);
    focusItem(nextItem2);
  };
  const handleClear = (event) => {
    ignoreFocus.current = true;
    setInputValueState("");
    if (onInputChange) {
      onInputChange(event, "", "clear");
    }
    handleValue(event, multiple ? [] : null, "clear");
  };
  const handleKeyDown = (other) => (event) => {
    if (other.onKeyDown) {
      other.onKeyDown(event);
    }
    if (event.defaultMuiPrevented) {
      return;
    }
    if (focusedItem !== -1 && !["ArrowLeft", "ArrowRight"].includes(event.key)) {
      setFocusedItem(-1);
      focusItem(-1);
    }
    if (event.which !== 229) {
      switch (event.key) {
        case "Home":
          if (popupOpen && handleHomeEndKeys) {
            event.preventDefault();
            changeHighlightedIndex({
              diff: "start",
              direction: "next",
              reason: "keyboard",
              event
            });
          }
          break;
        case "End":
          if (popupOpen && handleHomeEndKeys) {
            event.preventDefault();
            changeHighlightedIndex({
              diff: "end",
              direction: "previous",
              reason: "keyboard",
              event
            });
          }
          break;
        case "PageUp":
          event.preventDefault();
          changeHighlightedIndex({
            diff: -pageSize,
            direction: "previous",
            reason: "keyboard",
            event
          });
          handleOpen(event);
          break;
        case "PageDown":
          event.preventDefault();
          changeHighlightedIndex({
            diff: pageSize,
            direction: "next",
            reason: "keyboard",
            event
          });
          handleOpen(event);
          break;
        case "ArrowDown":
          event.preventDefault();
          changeHighlightedIndex({
            diff: 1,
            direction: "next",
            reason: "keyboard",
            event
          });
          handleOpen(event);
          break;
        case "ArrowUp":
          event.preventDefault();
          changeHighlightedIndex({
            diff: -1,
            direction: "previous",
            reason: "keyboard",
            event
          });
          handleOpen(event);
          break;
        case "ArrowLeft":
          if (!multiple && renderValue) {
            focusItem(0);
          } else {
            handleFocusItem(event, "previous");
          }
          break;
        case "ArrowRight":
          if (!multiple && renderValue) {
            focusItem(-1);
          } else {
            handleFocusItem(event, "next");
          }
          break;
        case "Enter":
          if (highlightedIndexRef.current !== -1 && popupOpen) {
            const option = filteredOptions[highlightedIndexRef.current];
            const disabled = getOptionDisabled ? getOptionDisabled(option) : false;
            event.preventDefault();
            if (disabled) {
              return;
            }
            selectNewValue(event, option, "selectOption");
            if (autoComplete) {
              inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
            }
          } else if (freeSolo && inputValue !== "" && inputValueIsSelectedValue === false) {
            if (multiple) {
              event.preventDefault();
            }
            selectNewValue(event, inputValue, "createOption", "freeSolo");
          }
          break;
        case "Escape":
          if (popupOpen) {
            event.preventDefault();
            event.stopPropagation();
            handleClose(event, "escape");
          } else if (clearOnEscape && (inputValue !== "" || multiple && value.length > 0 || renderValue)) {
            event.preventDefault();
            event.stopPropagation();
            handleClear(event);
          }
          break;
        case "Backspace":
          if (multiple && !readOnly && inputValue === "" && value.length > 0) {
            const index = focusedItem === -1 ? value.length - 1 : focusedItem;
            const newValue = value.slice();
            newValue.splice(index, 1);
            handleValue(event, newValue, "removeOption", {
              option: value[index]
            });
          }
          if (!multiple && renderValue && !readOnly) {
            setValueState(null);
            focusItem(-1);
          }
          break;
        case "Delete":
          if (multiple && !readOnly && inputValue === "" && value.length > 0 && focusedItem !== -1) {
            const index = focusedItem;
            const newValue = value.slice();
            newValue.splice(index, 1);
            handleValue(event, newValue, "removeOption", {
              option: value[index]
            });
          }
          if (!multiple && renderValue && !readOnly) {
            setValueState(null);
            focusItem(-1);
          }
          break;
        default:
      }
    }
  };
  const handleFocus = (event) => {
    setFocused(true);
    if (openOnFocus && !ignoreFocus.current) {
      handleOpen(event);
    }
  };
  const handleBlur = (event) => {
    if (unstable_isActiveElementInListbox(listboxRef)) {
      inputRef.current.focus();
      return;
    }
    setFocused(false);
    firstFocus.current = true;
    ignoreFocus.current = false;
    if (autoSelect && highlightedIndexRef.current !== -1 && popupOpen) {
      selectNewValue(event, filteredOptions[highlightedIndexRef.current], "blur");
    } else if (autoSelect && freeSolo && inputValue !== "") {
      selectNewValue(event, inputValue, "blur", "freeSolo");
    } else if (clearOnBlur) {
      resetInputValue(event, value, "blur");
    }
    handleClose(event, "blur");
  };
  const handleInputChange = (event) => {
    const newValue = event.target.value;
    if (inputValue !== newValue) {
      setInputValueState(newValue);
      setInputPristine(false);
      if (onInputChange) {
        onInputChange(event, newValue, "input");
      }
    }
    if (newValue === "") {
      if (!disableClearable && !multiple) {
        handleValue(event, null, "clear");
      }
    } else {
      handleOpen(event);
    }
  };
  const handleOptionMouseMove = (event) => {
    const index = Number(event.currentTarget.getAttribute("data-option-index"));
    if (highlightedIndexRef.current !== index) {
      setHighlightedIndex({
        event,
        index,
        reason: "mouse"
      });
    }
  };
  const handleOptionTouchStart = (event) => {
    setHighlightedIndex({
      event,
      index: Number(event.currentTarget.getAttribute("data-option-index")),
      reason: "touch"
    });
    isTouch.current = true;
  };
  const handleOptionClick = (event) => {
    const index = Number(event.currentTarget.getAttribute("data-option-index"));
    selectNewValue(event, filteredOptions[index], "selectOption");
    isTouch.current = false;
  };
  const handleItemDelete = (index) => (event) => {
    const newValue = value.slice();
    newValue.splice(index, 1);
    handleValue(event, newValue, "removeOption", {
      option: value[index]
    });
  };
  const handleSingleItemDelete = (event) => {
    handleValue(event, null, "removeOption", {
      option: value
    });
  };
  const handlePopupIndicator = (event) => {
    if (open) {
      handleClose(event, "toggleInput");
    } else {
      handleOpen(event);
    }
  };
  const handleMouseDown = (event) => {
    if (!event.currentTarget.contains(event.target)) {
      return;
    }
    if (event.target.getAttribute("id") !== id) {
      event.preventDefault();
    }
  };
  const handleClick = (event) => {
    if (!event.currentTarget.contains(event.target)) {
      return;
    }
    inputRef.current.focus();
    if (selectOnFocus && firstFocus.current && inputRef.current.selectionEnd - inputRef.current.selectionStart === 0) {
      inputRef.current.select();
    }
    firstFocus.current = false;
  };
  const handleInputMouseDown = (event) => {
    if (!disabledProp && (inputValue === "" || !open)) {
      handlePopupIndicator(event);
    }
  };
  let dirty = freeSolo && inputValue.length > 0;
  dirty = dirty || (multiple ? value.length > 0 : value !== null);
  let groupedOptions = filteredOptions;
  if (groupBy) {
    const indexBy = /* @__PURE__ */ new Map();
    let warn = false;
    groupedOptions = filteredOptions.reduce((acc, option, index) => {
      const group = groupBy(option);
      if (acc.length > 0 && acc[acc.length - 1].group === group) {
        acc[acc.length - 1].options.push(option);
      } else {
        if (true) {
          if (indexBy.get(group) && !warn) {
            console.warn(`MUI: The options provided combined with the \`groupBy\` method of ${componentName} returns duplicated headers.`, "You can solve the issue by sorting the options with the output of `groupBy`.");
            warn = true;
          }
          indexBy.set(group, true);
        }
        acc.push({
          key: index,
          index,
          group,
          options: [option]
        });
      }
      return acc;
    }, []);
  }
  if (disabledProp && focused) {
    handleBlur();
  }
  return {
    getRootProps: (other = {}) => ({
      ...other,
      onKeyDown: handleKeyDown(other),
      onMouseDown: handleMouseDown,
      onClick: handleClick
    }),
    getInputLabelProps: () => ({
      id: `${id}-label`,
      htmlFor: id
    }),
    getInputProps: () => ({
      id,
      value: inputValue,
      onBlur: handleBlur,
      onFocus: handleFocus,
      onChange: handleInputChange,
      onMouseDown: handleInputMouseDown,
      // if open then this is handled imperatively so don't let react override
      // only have an opinion about this when closed
      "aria-activedescendant": popupOpen ? "" : null,
      "aria-autocomplete": autoComplete ? "both" : "list",
      "aria-controls": listboxAvailable ? `${id}-listbox` : void 0,
      "aria-expanded": listboxAvailable,
      // Disable browser's suggestion that might overlap with the popup.
      // Handle autocomplete but not autofill.
      autoComplete: "off",
      ref: inputRef,
      autoCapitalize: "none",
      spellCheck: "false",
      role: "combobox",
      disabled: disabledProp
    }),
    getClearProps: () => ({
      tabIndex: -1,
      type: "button",
      onClick: handleClear
    }),
    getItemProps: ({
      index = 0
    } = {}) => ({
      ...multiple && {
        key: index
      },
      ...renderValue ? {
        "data-item-index": index
      } : {
        "data-tag-index": index
      },
      tabIndex: -1,
      ...!readOnly && {
        onDelete: multiple ? handleItemDelete(index) : handleSingleItemDelete
      }
    }),
    getPopupIndicatorProps: () => ({
      tabIndex: -1,
      type: "button",
      onClick: handlePopupIndicator
    }),
    // deprecated
    getTagProps: ({
      index
    }) => ({
      key: index,
      "data-tag-index": index,
      tabIndex: -1,
      ...!readOnly && {
        onDelete: handleItemDelete(index)
      }
    }),
    getListboxProps: () => ({
      role: "listbox",
      id: `${id}-listbox`,
      "aria-labelledby": `${id}-label`,
      ref: handleListboxRef,
      onMouseDown: (event) => {
        event.preventDefault();
      }
    }),
    getOptionProps: ({
      index,
      option
    }) => {
      const selected = (multiple ? value : [value]).some((value2) => value2 != null && isOptionEqualToValue(option, value2));
      const disabled = getOptionDisabled ? getOptionDisabled(option) : false;
      return {
        key: getOptionKey?.(option) ?? getOptionLabel(option),
        tabIndex: -1,
        role: "option",
        id: `${id}-option-${index}`,
        onMouseMove: handleOptionMouseMove,
        onClick: handleOptionClick,
        onTouchStart: handleOptionTouchStart,
        "data-option-index": index,
        "aria-disabled": disabled,
        "aria-selected": selected
      };
    },
    id,
    inputValue,
    value,
    dirty,
    expanded: popupOpen && anchorEl,
    popupOpen,
    focused: focused || focusedItem !== -1,
    anchorEl,
    setAnchorEl,
    focusedItem,
    // deprecated
    focusedTag: focusedItem,
    groupedOptions
  };
}
var useAutocomplete_default = useAutocomplete;

export {
  isFocusVisible,
  getTouchRippleUtilityClass,
  touchRippleClasses_default,
  getButtonBaseUtilityClass,
  buttonBaseClasses_default,
  ButtonBase_default,
  getCircularProgressUtilityClass,
  circularProgressClasses_default,
  CircularProgress_default,
  getButtonUtilityClass,
  buttonClasses_default,
  ButtonGroupContext_default,
  ButtonGroupButtonContext_default,
  Button_default,
  KeyboardArrowLeft_default,
  KeyboardArrowRight_default,
  getTabScrollButtonUtilityClass,
  tabScrollButtonClasses_default,
  TabScrollButton_default,
  getTabsUtilityClass,
  tabsClasses_default,
  Tabs_default,
  getTypographyUtilityClass,
  typographyClasses_default,
  Typography_default,
  usePreviousProps_default,
  createFilterOptions,
  useAutocomplete_default
};
//# sourceMappingURL=chunk-GEAUMHV7.js.map
