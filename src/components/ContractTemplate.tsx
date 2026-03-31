import React from 'react';
import { EventShow, BandProfile, ContractPreferences } from '../data/mocks';
import { formatCurrency } from '../utils/currency';
import { contractBgBase64 } from '../assets/contractBg';

interface Props {
  event: EventShow;
  band: BandProfile;
  prefs: ContractPreferences;
}

export const ContractTemplate: React.FC<Props> = ({ event, band, prefs }) => {
  if (!event || !event.date) return null;
  const [year, month, day] = event.date.split('-');
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const mesExtenso = months[parseInt(month, 10) - 1];

  let clauseIndex = 1;

  const nextClause = () => {
    return clauseIndex++;
  };

  return (
    <div id="pdf-contract-template" style={{ width: '210mm', minHeight: '297mm', padding: '45mm 20mm 30mm 20mm', backgroundColor: '#fff', color: '#000', fontFamily: 'Arial, sans-serif', fontSize: '11pt', lineHeight: '1.6', textAlign: 'justify', backgroundImage: `url(${contractBgBase64})`, backgroundSize: '210mm 297mm', backgroundRepeat: 'repeat-y' }}>
        
        {/* Folha de Rosto / Preamble */}
        <h1 style={{ textAlign: 'center', fontSize: '13pt', fontWeight: 'bold', marginBottom: '30px' }}>
          CONTRATO DE PRESTAÇÃO DE SERVIÇOS MUSICAIS
        </h1>

        <p style={{ marginBottom: '20px', textIndent: '40px' }}>
          <strong>O CONTRATADO</strong>, {band.name} pessoa jurídica de direito privado inscrita no CNPJ sob nº {band.cnpj}, com sede na {band.address}, na cidade de {band.city}, CEP: {band.cep}, neste ato representada pelo seu sócio proprietário {band.repName}, RG n.º {band.repRg}, CPF n.º {band.repCpf}, doravante denominado Músico e, de outro lado o <strong>{(prefs?.contratanteRazao || event.contractorName || '').toUpperCase()}</strong> pessoa jurídica inscrita no CPF/CNPJ sob nº {prefs?.contratanteCnpjCpf || '_______________'}, com sede na {prefs?.contratanteAddress || '_______________'}, {prefs?.contratanteCityCep || '_______________'}, doravante denominado simplesmente CONTRATANTE, celebram o presente Contrato de Prestação de Serviços Musicais, que se regerá pelas cláusulas seguintes:
        </p>

        <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>DO OBJETO DO CONTRATO</h2>
        <p style={{ textIndent: '40px', marginBottom: '10px' }}><strong>Cláusula {nextClause()}ª.</strong> Este contrato tem como objeto a apresentação de show musical do <strong>{band.name}</strong> no dia <strong>{day} de {mesExtenso} de {year}</strong>, com início às <strong>{event.time || '--:--'} horas</strong>, no local situado em <strong>{event.location}</strong>.</p>

        {prefs?.useDuration && (
          <>
            <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>DA DURAÇÃO DO SHOW</h2>
            <p style={{ textIndent: '40px', marginBottom: '10px' }}><strong>Cláusula {nextClause()}ª.</strong> O CONTRATADO poderá realizar breve(s) intervalo(s) se necessário, assim como o CONTRATANTE poderá solicitar interrupção do show para eventuais avisos e/ou acontecimentos.</p>
            <p style={{ textIndent: '40px', marginBottom: '10px' }}><strong>Cláusula {nextClause()}ª.</strong> Caso a Banda ultrapasse o tempo estabelecido por sua iniciativa, será de sua inteira responsabilidade. Caso ultrapasse por solicitação do CONTRATANTE, será cobrado acréscimo de 1/3 (um terço) do valor total contratado a cada hora excedente.</p>
          </>
        )}

        {prefs?.useEquipment && (
          <>
            <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>DOS EQUIPAMENTOS</h2>
            <p style={{ textIndent: '40px', marginBottom: '10px' }}><strong>Cláusula {nextClause()}ª.</strong> O CONTRATANTE deverá providenciar condições necessárias, como local reservado, cobertura e energia elétrica. A paralisação do evento por falta de energia isenta o CONTRATADO de culpa, mantendo o direito do recebimento integral.</p>
            <p style={{ textIndent: '40px', marginBottom: '10px' }}><strong>Cláusula {nextClause()}ª.</strong> O Som será responsabilidade do CONTRATADO, salvo acordo prévio distinto.</p>
          </>
        )}

        {prefs?.useConsumption && (
           <>
             <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>DA CONSUMAÇÃO</h2>
             <p style={{ textIndent: '40px', marginBottom: '10px' }}><strong>Cláusula {nextClause()}ª.</strong> A consumação da banda e equipe técnica durante o show e no camarim correrá por conta da CONTRATANTE{prefs?.consumptionType === 'Valor' ? `, com limite estipulado no valor de R$ ${prefs?.consumptionValue || '0,00'}` : ' integralmente'}.</p>
           </>
        )}

        <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>DO PAGAMENTO</h2>
        <p style={{ textIndent: '40px', marginBottom: '10px' }}><strong>Cláusula {nextClause()}ª.</strong> A CONTRATANTE compromete-se a pagar a quantia de <strong>{formatCurrency(event.totalValueCents)}</strong> ao CONTRATADO em contraprestação à apresentação musical.</p>
        <p style={{ textIndent: '40px' }}><strong>Dados para depósito:</strong> {band.bank || '—'} - Ag: {band.agency || '—'} - CC: {band.account || '—'} / PIX: {band.pix || '—'}.</p>

        {prefs?.useRescisao && (
          <>
            <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>DA RESCISÃO E MULTAS</h2>
            <p style={{ textIndent: '40px', marginBottom: '10px' }}><strong>Cláusula {nextClause()}ª.</strong> O contrato poderá ser rescindido a qualquer tempo por interesse da CONTRATANTE, mediante aviso prévio mínimo de 05 (cinco) dias, sem aplicação de multa.</p>
            <p style={{ textIndent: '40px', marginBottom: '10px' }}><strong>Cláusula {nextClause()}ª.</strong> Caso a CONTRATANTE opte pela rescisão com prazo inferior ao estabelecido, ficará obrigada ao pagamento de multa compensatória de {prefs?.rescisaoPenaltyPercent}% do valor total.</p>
            <p style={{ textIndent: '40px', marginBottom: '10px' }}><strong>Cláusula {nextClause()}ª.</strong> O não comparecimento do CONTRATADO, sem motivo de força maior, acarretará devolução integral de valores e pagamento de multa equivalente a {prefs?.rescisaoPenaltyPercent}% do contrato.</p>
          </>
        )}

        {prefs?.useCivilLGPD && (
          <>
            <h2 style={{ fontSize: '11pt', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>DAS DISPOSIÇÕES FINAIS (LGPD / RESP. CIVIL)</h2>
            <p style={{ textIndent: '40px', marginBottom: '10px' }}><strong>Cláusula {nextClause()}ª.</strong> A CONTRATADA declara ser a única e integralmente responsável pelo cumprimento das normas relativas a direitos autorais (ECAD). Também responsabiliza-se por danos de sua equipe.</p>
            <p style={{ textIndent: '40px', marginBottom: '10px' }}><strong>Cláusula {nextClause()}ª.</strong> Ambas as partes comprometem-se a tratar os dados pessoais em estrita conformidade com a LGPD (Lei 13.709/2018) e Lei Anticorrupção (Lei 12.846/2013).</p>
          </>
        )}

        <div style={{ marginTop: '70px', display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
          <div style={{ width: '45%' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '5px' }}><strong>{band.name.toUpperCase()}</strong><br/>CONTRATADO</div>
          </div>
          <div style={{ width: '45%' }}>
            <div style={{ borderTop: '1px solid #000', paddingTop: '5px' }}><strong>{(prefs?.contratanteRazao || event.contractorName || '').toUpperCase()}</strong><br/>CONTRATANTE</div>
          </div>
        </div>
        
        <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '10pt', color: '#555' }}>
          {band.city.split('/')[0]}, {day} de {mesExtenso} de {year}.<br/>
          Assinado digitalmente pelas partes via ICP-Brasil.
        </div>

      </div>
  );
};
