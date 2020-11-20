import * as Font from 'expo-font';
import React, { useEffect, useState } from 'react';
import RootStackScreens from './components/RootStackScreens/RootStackScreens.jsx'
import Loader from './components/Loader/Loader.jsx';
import { Provider } from "react-redux";
import store from './redux/store/store.js';
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from 'react-native'

import { NavigationContainer } from '@react-navigation/native';


const App = () => {

  const [ready, setReady] = useState(false);

  useEffect(() => {
    native_base();
    setTimeout(() => {
      setReady(true);
    }, 1000);
  });


  const app = !ready ?
    (
      <Loader/>
    )
    :
    (
      <Provider store={store}>
        < NavigationContainer>
          <StatusBar 
            barStyle='light-content'
            backgroundColor='#171717'
          />
          <RootStackScreens />
        </NavigationContainer >
      </Provider>
    );
  return app;
};

async function native_base() {
  await Font.loadAsync({
    Roboto: require("native-base/Fonts/Roboto.ttf"),
    Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf"),
    ...Ionicons.font,
  });
};


export default App;

