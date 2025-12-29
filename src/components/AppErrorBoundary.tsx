import * as Sentry from '@sentry/react-native';
import React from 'react';

export default class AppErrorBoundary extends React.Component<any, { err?: Error; info?: any }> {
    state = {};
    componentDidCatch(error: Error, info: any) {
        Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
        this.setState({ err: error, info });
    }
    render() { return this.props.children; }
}
