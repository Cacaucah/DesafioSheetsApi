const {google} = require('googleapis');
const keys = require('./desafioAPI.json')

//json web token
const client = new google.auth.JWT(
    keys.client_email, 
    null, 
    keys.private_key, 
    ['https://www.googleapis.com/auth/spreadsheets']
);

//constantes para situação do Aluno;
const aprovado = 'Aprovado';
const reprovadoPorNota = 'Reprovado por Nota';
const exameFinal = 'Exame Final';
const reprovadoPorFalta = 'Reprovado por Falta';
const limiteDeFaltas = parseFloat(0.25*60);

//função de conexão
client.authorize(function(error, tokens){
    if(error){
        console.log(error);
        return;
    }else{
        console.log('Conectado! :)');
        //se conectou, então passa o cliente para a função 
        rodar(client);
    }

});

async function rodar(client){

    const conexaoApi = google.sheets({version: 'v4', auth: client});

    const planilha = {
        //id da planilha
        spreadsheetId: '1vXqYBjuSeramVAps8WxrBqIecr5y5saewobOnBQYILE',
        //range de leitura
        range: 'engenharia_de_software!A4:H27'
    }
    //realizando o get para pegar as informações da planilha
    var data = await conexaoApi.spreadsheets.values.get(planilha);

    var dadosDosAlunosArray = data.data.values;
    let novosDados = dadosDosAlunosArray.map(function(row){
        var mediaAluno = ((parseInt(row[3])+parseInt(row[4])+parseInt(row[5]))/3)*0.1;
        var faltas = row[2];
        let situacaoAluno = situacaoAlunoPorNota(mediaAluno.toFixed(2), faltas);
        console.log("Situação do aluno: " + situacaoAluno);
        row.push(situacaoAluno);
        if(situacaoAluno == exameFinal){
            //encontrando o naf para aprovação
            naf = (5*2)-mediaAluno;
            //de acordo com a formula (m+naf)/2
            notaAprovacaoFinal = (mediaAluno+naf)/2;
            console.log(notaAprovacaoFinal);
            row.push(notaAprovacaoFinal);
        }else{           
            row.push(0);
        }
        return row;
    })
    
    console.log(novosDados);
    //escrevendo dados na planilha
    const updatePlanilha = {
        //id da planilha
        spreadsheetId: '1vXqYBjuSeramVAps8WxrBqIecr5y5saewobOnBQYILE',
        //atualização a partir do a4
        range: 'engenharia_de_software!A4',
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: novosDados
        }
    }
    
    var response = await conexaoApi.spreadsheets.values.update(updatePlanilha);
    console.log(response);
}

notaAprovacaoFinal = (faltasPorAluno) =>{
    if(faltasPorAluno>limiteDeFaltas){
        return reprovadoPorFalta;
    }
    return "";
   
}
situacaoAlunoPorNota = (mediaAluno, faltas) =>{
    if(faltas>limiteDeFaltas){
        return reprovadoPorFalta;
    }else if(mediaAluno<5){
        return reprovadoPorNota;
    }
    else if(mediaAluno>=5&&mediaAluno<7){
        return exameFinal;
    }else{
        return aprovado;
    }
}