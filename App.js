
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';

import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';

export default function App() {
  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [precisao, setPrecisao] = useState(null);

  const [buscandoLocalizacao, setBuscandoLocalizacao] =
    useState(false);

  const [statusLocalizacao, setStatusLocalizacao] = useState(
    'Clique em OBTER LOCALIZAÇÃO para começar.'
  );

  // Carrega os usuários de exemplo da API
  useEffect(() => {
    async function buscarUsuarios() {
      try {
        const response = await fetch(
          'https://jsonplaceholder.typicode.com/users'
        );

        if (!response.ok) {
          throw new Error('Não foi possível buscar os usuários.');
        }

        const data = await response.json();

        const usuariosFormatados = data.map((usuario) => ({
          ...usuario,
          latitude: null,
          longitude: null,
          precisao: null,
        }));

        setUsuarios(usuariosFormatados);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);

        Alert.alert(
          'Aviso',
          'Não foi possível carregar os usuários de exemplo. Você ainda pode cadastrar novos usuários.'
        );
      } finally {
        setCarregando(false);
      }
    }

    buscarUsuarios();
  }, []);

  // Obtém latitude, longitude e precisão estimada
  const obterLocalizacao = async () => {
    setBuscandoLocalizacao(true);
    setStatusLocalizacao('Solicitando acesso à localização...');

    console.log('Botão de localização acionado');

    try {
      let posicao;

      // Localização pelo navegador
      if (Platform.OS === 'web') {
        if (
          typeof navigator === 'undefined' ||
          !navigator.geolocation
        ) {
          throw new Error(
            'Este navegador não oferece suporte à geolocalização.'
          );
        }

        posicao = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0,
            }
          );
        });
      } else {
        // Localização pelo Expo Go
        const permissao =
          await Location.requestForegroundPermissionsAsync();

        if (permissao.status !== 'granted') {
          throw new Error(
            'Permissão negada. Autorize a localização nas configurações do dispositivo.'
          );
        }

        const servicosAtivos =
          await Location.hasServicesEnabledAsync();

        if (!servicosAtivos) {
          throw new Error(
            'Ative os serviços de localização do dispositivo.'
          );
        }

        posicao = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
      }

      const lat = posicao.coords.latitude;
      const lon = posicao.coords.longitude;
      const acc = posicao.coords.accuracy;

      setLatitude(lat);
      setLongitude(lon);
      setPrecisao(acc);

      setStatusLocalizacao(
        `Localização obtida! Precisão: ${
          acc !== null
            ? `${acc.toFixed(1)} metros`
            : 'indisponível'
        }.`
      );

      console.log('Latitude:', lat);
      console.log('Longitude:', lon);
      console.log('Precisão estimada (m):', acc);
    } catch (erro) {
      console.error('Erro na localização:', erro);

      let mensagem = 'Não foi possível obter a localização.';

      if (erro.code === 1) {
        mensagem =
          'Permissão de localização negada. Autorize o acesso nas configurações do navegador ou dispositivo.';
      } else if (erro.code === 2) {
        mensagem =
          'A posição está indisponível. Verifique o GPS ou a conexão.';
      } else if (erro.code === 3) {
        mensagem =
          'O tempo para obter a localização terminou. Tente novamente.';
      } else if (erro.message) {
        mensagem = erro.message;
      }

      setStatusLocalizacao(`Erro: ${mensagem}`);

      Alert.alert('Problema com a localização', mensagem);
    } finally {
      setBuscandoLocalizacao(false);
    }
  };

  // Cadastra um usuário com as coordenadas obtidas
  const adicionarUsuario = () => {
    if (!nome.trim() || !endereco.trim()) {
      Alert.alert(
        'Atenção',
        'Preencha o nome e o endereço antes de cadastrar.'
      );
      return;
    }

    if (latitude === null || longitude === null) {
      Alert.alert(
        'Localização necessária',
        'Clique em OBTER LOCALIZAÇÃO e aguarde a captura das coordenadas antes de cadastrar.'
      );
      return;
    }

    const novoUsuario = {
      id: Date.now().toString(),
      name: nome.trim(),
      address: {
        street: endereco.trim(),
        suite: '',
        city: '',
      },
      latitude,
      longitude,
      precisao,
    };

    setUsuarios((listaAtual) => [
      novoUsuario,
      ...listaAtual,
    ]);

    setNome('');
    setEndereco('');
    setLatitude(null);
    setLongitude(null);
    setPrecisao(null);

    setStatusLocalizacao(
      'Cadastro realizado. Clique para obter uma nova localização.'
    );

    Alert.alert(
      'Sucesso',
      'Usuário cadastrado com localização!'
    );
  };

  // Exclui um usuário da lista
  const excluirUsuario = (id) => {
    Alert.alert(
      'Excluir usuário',
      'Deseja realmente excluir este cadastro?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            setUsuarios((listaAtual) =>
              listaAtual.filter(
                (usuario) => usuario.id !== id
              )
            );
          },
        },
      ]
    );
  };

  // Cartão de cada usuário
  const renderizarUsuario = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.nome}>{item.name}</Text>

      <Text style={styles.rotulo}>Endereço:</Text>
      <Text style={styles.info}>
        {item.address?.street || 'Não informado'}
        {item.address?.city
          ? ` - ${item.address.city}`
          : ''}
      </Text>

      <View style={styles.linha} />

      <Text style={styles.rotulo}>Latitude:</Text>
      <Text style={styles.info}>
        {item.latitude !== null &&
        item.latitude !== undefined
          ? Number(item.latitude).toFixed(6)
          : 'Não registrada'}
      </Text>

      <Text style={styles.rotulo}>Longitude:</Text>
      <Text style={styles.info}>
        {item.longitude !== null &&
        item.longitude !== undefined
          ? Number(item.longitude).toFixed(6)
          : 'Não registrada'}
      </Text>

      <Text style={styles.rotulo}>
        Precisão estimada:
      </Text>
      <Text style={styles.info}>
        {item.precisao !== null &&
        item.precisao !== undefined
          ? `${Number(item.precisao).toFixed(1)} metros`
          : 'Não registrada'}
      </Text>

      <TouchableOpacity
        style={styles.botaoExcluir}
        onPress={() => excluirUsuario(item.id)}
      >
        <Text style={styles.textoBotao}>EXCLUIR</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulo}>
          SISTEMA DE CADASTRO DE USUÁRIOS
        </Text>

        <Text style={styles.subtitulo}>
          CRUD + LOCALIZAÇÃO
        </Text>

        <View style={styles.formulario}>
          <Text style={styles.rotulo}>Nome</Text>

          <TextInput
            style={styles.input}
            placeholder="Digite o nome"
            value={nome}
            onChangeText={setNome}
          />

          <Text style={styles.rotulo}>Endereço</Text>

          <TextInput
            style={styles.input}
            placeholder="Digite o endereço"
            value={endereco}
            onChangeText={setEndereco}
          />

          <Text style={styles.rotulo}>Latitude</Text>

          <TextInput
            style={styles.input}
            placeholder="Aguardando localização..."
            value={
              latitude !== null
                ? latitude.toFixed(6)
                : ''
            }
            editable={false}
          />

          <Text style={styles.rotulo}>Longitude</Text>

          <TextInput
            style={styles.input}
            placeholder="Aguardando localização..."
            value={
              longitude !== null
                ? longitude.toFixed(6)
                : ''
            }
            editable={false}
          />

          <Text style={styles.rotulo}>
            Precisão estimada
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Aguardando localização..."
            value={
              precisao !== null
                ? `${precisao.toFixed(1)} metros`
                : ''
            }
            editable={false}
          />

          <TouchableOpacity
            style={[
              styles.botaoLocalizacao,
              buscandoLocalizacao &&
                styles.botaoDesabilitado,
            ]}
            onPress={obterLocalizacao}
            disabled={buscandoLocalizacao}
          >
            {buscandoLocalizacao ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.textoBotao}>
                OBTER LOCALIZAÇÃO
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.statusLocalizacao}>
            {statusLocalizacao}
          </Text>

          <TouchableOpacity
            style={styles.botaoCadastrar}
            onPress={adicionarUsuario}
          >
            <Text style={styles.textoBotao}>
              CADASTRAR
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.tituloLista}>
          USUÁRIOS CADASTRADOS
        </Text>

        {carregando ? (
          <ActivityIndicator
            size="large"
            color="#333333"
            style={styles.carregando}
          />
        ) : usuarios.length === 0 ? (
          <Text style={styles.vazio}>
            Nenhum usuário cadastrado.
          </Text>
        ) : (
          <FlatList
            data={usuarios}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderizarUsuario}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d2e900',
  },

  conteudo: {
    paddingTop: 55,
    paddingHorizontal: 14,
    paddingBottom: 30,
  },

  titulo: {
    fontSize: 23,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#202020',
    marginHorizontal: 8,
  },

  subtitulo: {
    fontSize: 17,
    textAlign: 'center',
    color: '#555555',
    marginTop: 8,
    marginBottom: 18,
  },

  formulario: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 22,
  },

  rotulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 9,
    backgroundColor: '#fafafa',
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#222222',
    marginBottom: 8,
  },

  botaoLocalizacao: {
    backgroundColor: '#318746',
    minHeight: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    marginTop: 10,
    padding: 12,
  },

  botaoCadastrar: {
    backgroundColor: '#333333',
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    marginTop: 10,
    padding: 12,
  },

  botaoDesabilitado: {
    opacity: 0.65,
  },

  textoBotao: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  statusLocalizacao: {
    fontSize: 14,
    color: '#333333',
    marginTop: 10,
    marginBottom: 8,
    textAlign: 'center',
  },

  tituloLista: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#202020',
    marginBottom: 12,
  },

  card: {
    backgroundColor: '#ffffff',
    padding: 17,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },

  nome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 7,
  },

  info: {
    fontSize: 15,
    color: '#444444',
    marginBottom: 5,
  },

  linha: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 8,
  },

  botaoExcluir: {
    backgroundColor: '#d62828',
    minHeight: 42,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },

  carregando: {
    marginTop: 20,
    marginBottom: 20,
  },

  vazio: {
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 10,
    textAlign: 'center',
  },
});
