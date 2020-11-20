import React from 'react';
import { View, Text } from 'react-native';
import LottieView from 'lottie-react-native';


const Loader = () => {
    return (
        <LottieView source={require('../../assets/5215-loading-checkmark.json')} autoPlay loop />
    )
};

export default Loader;