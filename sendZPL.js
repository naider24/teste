const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const BTSerialPort = require('bluetooth-serial-port').BluetoothSerialPort;

const printerAddress = '48:A4:93:CD:B8:E5';  

app.use(bodyParser.json());
app.use(cors());


app.get('/dispositivos-pareados', (req, res) => {
    const btSerial = new BTSerialPort();

    btSerial.listPairedDevices(function(pairedDevices) {
        res.json(pairedDevices);
    }, function(err) {
        console.error('Erro ao listar dispositivos pareados:', err);
        res.status(500).json({ error: 'Erro ao listar dispositivos pareados' });
    });
});


app.post('/imprimir', (req, res) => {
    const zplCommand = req.body.zpl;  

    if (!zplCommand) {
        return res.status(400).json({ error: 'ZPL não encontrado na requisição' });
    }

    const btSerial = new BTSerialPort();
    btSerial.findSerialPortChannel(printerAddress, function(channel) {
        btSerial.connect(printerAddress, channel, function() {
            console.log('Conectado à impressora via Bluetooth.');

            btSerial.write(Buffer.from(zplCommand, 'utf-8'), function(err, bytesWritten) {
                if (err) {
                    console.error('Erro ao enviar comando para a impressora:', err);
                    return res.status(500).json({ error: 'Erro ao enviar comando para a impressora' });
                }
                console.log('Comando ZPL enviado para a impressora:', zplCommand);
                btSerial.close();  

                res.json({ message: 'Comando ZPL enviado com sucesso para a impressora' });
            });
        }, function() {
           
            res.status(500).json({ error: 'Falha ao conectar à impressora via Bluetooth' });
        });
    }, function() {
        console.error('Impressora Bluetooth não encontrada.');
        res.status(500).json({ error: 'Impressora Bluetooth não encontrada' });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
