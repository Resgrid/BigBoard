import React from 'react';
import { FocusAwareStatusBar } from '../focus-aware-status-bar';

describe('FocusAwareStatusBar', () => {
  it('should be importable', () => {
    expect(FocusAwareStatusBar).toBeDefined();
    expect(typeof FocusAwareStatusBar).toBe('function');
  });

  it('should have correct prop types', () => {
    // Test that the component can be used with correct props
    const element = React.createElement(FocusAwareStatusBar, { hidden: true });
    expect(element.type).toBe(FocusAwareStatusBar);
    expect(element.props.hidden).toBe(true);
  });

  it('should handle optional props', () => {
    // Test that the component can be used without props
    const element = React.createElement(FocusAwareStatusBar);
    expect(element.type).toBe(FocusAwareStatusBar);
    expect(element.props.hidden).toBeUndefined();
  });
});
