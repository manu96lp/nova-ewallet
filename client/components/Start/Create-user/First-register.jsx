import React, { useState } from 'react';
import axios from 'axios'
import { StyleSheet } from 'react-native';
import { Container, Form, Item, Input, Label, Text, Button, Picker } from 'native-base';
import { ScrollView } from 'react-native-gesture-handler';
import { useDispatch, useSelector } from 'react-redux';
import { createUser } from '../../../redux/actions/userActions.js'



const CreateUser = ({navigation}) => {

    const dispatch = useDispatch();
  
    const [data, setData] = useState({
        username: '',
        email: '',
        contraseña: ''
    });

    const createUser =  () => {
        return axios.post("http://192.168.0.209:3000/user/", data)
        .then(resp=>{
            console.log('SOY LA RESPUESTA', resp.data)
        })
        .then(() => navigation.navigate('Verificacion'))
        .catch(err=>{
            console.log('Soy el error', err)
        })
    };

    const handleSubmit = () => {
        createUser();
    };

    return (
        <Container style={styles.container}>
            <ScrollView>
                <Form>
                   
                    <Item floatingLabel>
                        <Label>Nombre de Usuario *</Label>
                        <Input onChangeText={username => setData({ ...data, username })}></Input>
                    </Item>

                    <Item floatingLabel>
                        <Label>Email *</Label>
                        <Input onChangeText={email => setData({ ...data, email })}></Input>
                    </Item>

                    <Item floatingLabel>
                        <Label>Contraseña *</Label>
                        <Input onChangeText={contraseña => setData({ ...data, contraseña })}></Input>
                    </Item>
                </Form>
                <Button
                    block
                    dark
                    style={styles.button}
                    onPress={() => handleSubmit()}
                >
                    <Text>Siguiente</Text>
                </Button>
            </ScrollView>
        </Container>

    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'yellow'
    },
    button: {
        marginBottom:100,
        bottom: -50,
        width: 350,
        alignSelf: 'center',
        marginTop: 15,
        justifyContent: 'center'
    },
    titulos: {
        marginTop: 50,
        alignSelf: 'center',
        fontWeight: "bold"
    }
});


export default CreateUser;