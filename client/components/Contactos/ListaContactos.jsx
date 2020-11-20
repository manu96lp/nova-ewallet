import React,{useEffect,useState}  from 'react';
import s from './styles'
import {FlatList, View,TouchableHighlight,Image} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Container, Form, Item, Input, Label, Text, Button ,Content} from 'native-base';
import { ListItem} from 'react-native-elements'
import { useDispatch, useSelector } from 'react-redux';
import {allContacts , deleteContact,addContact} from '../../redux/actions/contacts'
import Modal from 'react-native-modal'; 

const  Contactos = ()=>{
  const contactos = useSelector((state) => state.contactos);
  const user = useSelector((state) => state.userReducer);
  const dispatch = useDispatch();
  const [currentContact , setCurrent] = useState()
  const [modal,setModal] = useState(false)
  const [modal1,setModal1] = useState(false)
  const [input, setInput] = useState({
    email: '',
    nickname: ''
});
  useEffect( () => {
    dispatch(allContacts(user.id))
  },[])
  console.log("SON LOS CONTACTOS ",contactos)
  const selectContact=(id)=>{
    setCurrent(id)
    setModal(!modal)
  }
  const delte = (id)=>{
    dispatch(deleteContact(id))
    setModal(!modal)
  }
  const handleSubmit = () => {
    console.log(input)
    setModal1(!modal1)
    dispatch(addContact({id:user.id,email:input.email,nickname:input.nickname}))
};
  let  keyExtractor = (item, index) => index.toString()
  
  let renderItem = ({ item }) => (
    <ListItem bottomDivider containerStyle={s.item}>
      <Image source={require('../../assets/logoUser.png')} style={{width:40, height:40}}/>
      <ListItem.Content >
        <ListItem.Title>{item.nickname}</ListItem.Title>
        <ListItem.Subtitle>{item.email}</ListItem.Subtitle>
      </ListItem.Content>
      <TouchableHighlight style={{height:40,justifyContent:"center"}} underlayColor='transparent' onPress={()=>{selectContact(item.id)}}>
        <Icon size={25} name='user-minus'/>
      </TouchableHighlight>
    </ListItem>
  )
  return (
    
    <View style={s.container}>
       <Modal
        avoidKeyboard={false}
        isVisible={modal1}
        animationInTiming={600}
        animationOutTiming={600}
        onBackdropPress={() => setModal1(!modal1)}>
        <View style={s.modalAdd}>
          <Form >
              <Item floatingLabel>
                  <Label >Email</Label>
                  <Input  onChangeText={email => setInput({ ...input, email })} />
              </Item>
              <Item floatingLabel>
                  <Label >Nombre</Label>
                  <Input onChangeText={nickname => setInput({ ...input, nickname })}/>
              </Item>
          </Form>
            <Button
              block
              dark
              style={s.button}
              onPress={() => handleSubmit()}>
              <Text>Agregar</Text>
            </Button>
        </View> 
      </Modal>

      <Modal
        avoidKeyboard={false}
        isVisible={modal}
        animationInTiming={600}
        animationOutTiming={600}
        onBackdropPress={() => setModal(!modal)}>
        <View style={s.modalDelete}>
            <Text style={s.pregunta}>Está seguro que desea eliminar el Contacto ?</Text>
            <Container style={s.groupButton}>
              <Button
                style={s.buttonDelete}
                onPress={() => setModal(!modal)}>
                <Text>No</Text>
              </Button>
              <Button
                style={s.buttonDelete}
                onPress={() => delte(currentContact)}>
                <Text>Si</Text>
              </Button>
              </Container>
        </View> 
      </Modal>  

        <FlatList
          keyExtractor={keyExtractor}
          data={contactos.listaContactos}
          renderItem={renderItem}
        />
        <TouchableHighlight style={s.addButton}
          underlayColor='#4A1491' onPress={() => setModal1(!modal1)}>
           <Icon style={s.addUser} size={55} name='plus-circle'/>
        </TouchableHighlight>
    </View>
  )
}

export default Contactos;