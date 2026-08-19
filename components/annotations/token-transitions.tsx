import {
  type AnnotationHandler,
  type CustomPreProps,
  InnerPre,
  InnerToken,
  getPreRef,
} from 'codehike/code';
import {
  type TokenTransitionsSnapshot,
  calculateTransitions,
  getStartingSnapshot,
} from 'codehike/utils/token-transitions';
import React from 'react';

const MAX_TRANSITION_DURATION = 900; // milliseconds

class SmoothPre extends React.Component<CustomPreProps> {
  ref: React.RefObject<HTMLPreElement | null>;

  constructor(props: CustomPreProps) {
    super(props);
    this.ref = getPreRef(this.props);
  }

  render() {
    return <InnerPre merge={this.props} style={{ position: 'relative' }} />;
  }

  getSnapshotBeforeUpdate() {
    return getStartingSnapshot(this.ref.current!);
  }

  componentDidUpdate(
    _prevProps: never,
    _prevState: never,
    snapshot: TokenTransitionsSnapshot,
  ) {
    const transitions = calculateTransitions(this.ref.current!, snapshot);
    transitions.forEach(({ element, keyframes, options }) => {
      const { translateX, translateY, ...kf } = keyframes as Record<string, unknown>;
      if (translateX && translateY) {
        // compose both axes into a single `translate` keyframe
        const x = translateX as [number, number];
        const y = translateY as [number, number];
        kf.translate = [`${x[0]}px ${y[0]}px`, `${x[1]}px ${y[1]}px`];
      }
      element.animate(kf as Keyframe[] | PropertyIndexedKeyframes, {
        duration: options.duration * MAX_TRANSITION_DURATION,
        delay: options.delay * MAX_TRANSITION_DURATION,
        easing: options.easing,
        fill: 'both',
      });
    });
  }
}

export const tokenTransitions: AnnotationHandler = {
  name: 'token-transitions',
  PreWithRef: SmoothPre,
  Token: (props) => <InnerToken merge={props} style={{ display: 'inline-block' }} />,
};
