import React,{useEffect} from 'react';
import { Image, View, Text } from 'react-native';
import { Button, Container } from 'native-base';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useDispatch, useSelector } from 'react-redux';
import s from './style.js';
import {refresh} from '../../redux/actions/userActions';


const PrincipalScreen = ({navigation}) => {
    const user = useSelector((state) => state.userReducer);
    const dispatch = useDispatch();
    
    useEffect(() => {
        console.log("USER ID !!",user.id)
        dispatch(refresh(user.id))
    },[])
    return (

        <Container style={s.container}>
            <View style={s.headerContainer}>
                <View style={s.headerAmount}>
                    <Image source={require('../../assets/logoUser.png')}
                        style={s.userImage}
                    />
                    <View style={s.balanceContainer}>
                        <Text style={s.amount}>{user.balanceArs} ARS</Text>
                        <Text style={s.amountDescription}>Balance total de la cuenta</Text>
                    </View>
                </View>
                <View style={s.generalContainer}>
                    <Text style={s.titleGeneral}>Resumen Mensual</Text>
                    <View style={s.amountsContainer}>
                        <View style={s.columnAmount}>
                            <Icon size={49} name='hand-holding-usd' />
                            <Text>Ingresos</Text>
                            <Text style={s.amountGeneral}>3000 ARS</Text>
                        </View>
                        <View style={s.columnAmount}>
                            <Icon size={49} name='file-invoice-dollar' />
                            <Text>Gastos</Text>
                            <Text style={s.amountGeneral}>2000 ARS</Text>
                        </View>
                    </View>
                </View>
            </View>
            <View style={s.buttonsContainer}>
                <Button style={s.secondaryButton} onPress={() => navigation.navigate('Recargar Dinero')}>
                    <Icon style={s.icon} size={30} name='vote-yea' />
                    <Text style={s.textOption}>Recargar dinero</Text>
                </Button>
                <Button style={s.secondaryButton}>
                    <Icon style={s.icon} size={30} name='paper-plane' />
                    <Text style={s.textOption}>Enviar dinero</Text>
                </Button>
            </View>
            <View style={s.buttonsContainer}>
                <Button style={s.button} onPress={() => navigation.navigate('Transacciones')}>
                    <Icon style={s.icon} size={30} name='history' />
                    <Text style={s.textOption}>Transacciones</Text>
                </Button>
                <Button style={s.button} onPress={() => navigation.navigate('Estadisticas')}>
                    <Icon style={s.icon} size={30} name='chart-bar' />
                    <Text style={s.textOption}>Estadisticas</Text>
                </Button>
                <Button style={s.button} >
                    <Icon style={s.icon} size={30} name='user-circle' />
                    <Text style={s.textOption}>Mis datos</Text>
                </Button>
                <Button style={s.button}>
                    <Icon style={s.icon} size={30} name='tags' />
                    <Text style={s.textOption}>Mis productos</Text>
                </Button>
            </View>
        </Container>

    );
};

export default PrincipalScreen;