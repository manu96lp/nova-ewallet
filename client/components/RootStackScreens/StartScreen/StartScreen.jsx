import React from 'react';
import { Image } from 'react-native';
import { Button, Text, View, Container } from 'native-base';
import Icon from 'react-native-vector-icons/SimpleLineIcons';
import s from './styles.js'


const StartScreen = ({ navigation }) => {
    return (
        <Container style={s.default}>
            <View>
                <Image source={require('../../../assets/logohb.png')}
                    style={s.image} />
            </View>
            <View style={s.container}>
                <Button
                    block
                    dark
                    style={s.button}
                    onPress={() => navigation.navigate('Ingresar')}
                >
                    <Icon size={30} name='login' style={s.icon}/>
                    <Text>Ingresar</Text>
                </Button>
                <Button
                    block
                    dark
                    style={s.button}
                    onPress={() => navigation.navigate('Registrarse')}
                >
                    <Icon size={30} name='user-follow' style={s.icon}/>
                    <Text>Registrarme</Text>
                </Button>
            </View>
        </Container>
    );
};

export default StartScreen;