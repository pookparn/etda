const xmlToJson = require('xml-to-json-stream');
const parser = xmlToJson({attributeMode:true});
const fs     = require('fs'),
      Ajv    = require('ajv')

const ajv       = new Ajv(),
    schema    = JSON.parse(fs.readFileSync('./schema.json')),
    countryData    = JSON.parse(fs.readFileSync('./country_data.json')),
    validator = {}

var xml = `
<employee id="123456">
    <name>Alex</name>
</employee>`

xml =`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><rsm:Receipt_CrossIndustryInvoice xmlns:rsm="urn:etda:uncefact:data:standard:Receipt_CrossIndustryInvoice:2" xmlns:ram="urn:etda:uncefact:data:standard:Receipt_ReusableAggregateBusinessInformationEntity:2" xmlns:ns3="http://www.w3.org/2000/09/xmldsig#"><rsm:ExchangedDocumentContext><ram:GuidelineSpecifiedDocumentContextParameter><ram:ID schemeAgencyID="ETDA" schemeVersionID="v2.0">ER3-2560</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter></rsm:ExchangedDocumentContext><rsm:ExchangedDocument><ram:ID>RDRCT2562/00363670</ram:ID><ram:Name>ใบรับ</ram:Name><ram:TypeCode>T01</ram:TypeCode><ram:IssueDateTime>2019-03-28T17:00:00.000Z</ram:IssueDateTime><ram:CreationDateTime>2019-03-28T17:00:00.000Z</ram:CreationDateTime></rsm:ExchangedDocument><rsm:SupplyChainTradeTransaction><ram:ApplicableHeaderTradeAgreement><ram:SellerTradeParty><ram:Name>บริษัท ธนาคารกสิกรไทย จำกัด(มหาชน)</ram:Name><ram:SpecifiedTaxRegistration><ram:ID schemeID="TXID">010753600031500000</ram:ID></ram:SpecifiedTaxRegistration><ram:PostalTradeAddress><ram:PostcodeCode>10140</ram:PostcodeCode><ram:LineOne>1 ซอยราษฎร์บูรณะ 27/1 ถนนราษฎร์บูรณะ แขวงราษฎร์บูรณะ</ram:LineOne><ram:LineTwo>เขตราษฎร์บูรณะ กรุงเทพฯ 10140</ram:LineTwo><ram:CityName>1024</ram:CityName><ram:CitySubDivisionName>102401</ram:CitySubDivisionName><ram:CountryID schemeID="3166-1 alpha-2">TH</ram:CountryID><ram:CountrySubDivisionID>10</ram:CountrySubDivisionID><ram:BuildingNumber>1</ram:BuildingNumber></ram:PostalTradeAddress></ram:SellerTradeParty><ram:BuyerTradeParty><ram:Name>ไชยนรินทร์  ศรีเฟื่องฟุ้ง</ram:Name><ram:SpecifiedTaxRegistration><ram:ID schemeID="NIDN">3100901953206</ram:ID></ram:SpecifiedTaxRegistration><ram:PostalTradeAddress><ram:PostcodeCode>10110</ram:PostcodeCode><ram:LineOne>90/8 ซ.สุขุมวิท 31 (สวัสดี) ต.คลองตันเหนือ</ram:LineOne><ram:LineTwo>อ.วัฒนา จ.กทม. 10110</ram:LineTwo><ram:CountryID schemeID="3166-1 alpha-2">TH</ram:CountryID></ram:PostalTradeAddress></ram:BuyerTradeParty></ram:ApplicableHeaderTradeAgreement><ram:ApplicableHeaderTradeDelivery/><ram:ApplicableHeaderTradeSettlement><ram:SpecifiedTradeSettlementHeaderMonetarySummation><ram:GrandTotalAmount currencyID="THB">10.13</ram:GrandTotalAmount></ram:SpecifiedTradeSettlementHeaderMonetarySummation></ram:ApplicableHeaderTradeSettlement><ram:IncludedSupplyChainTradeLineItem><ram:AssociatedDocumentLineDocument><ram:LineID>1</ram:LineID></ram:AssociatedDocumentLineDocument><ram:SpecifiedTradeProduct><ram:Name>ดอกเบี้ยเบิกเงินเกินบัญชี</ram:Name></ram:SpecifiedTradeProduct><ram:SpecifiedLineTradeAgreement/><ram:SpecifiedLineTradeDelivery><ram:BilledQuantity>1</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery><ram:SpecifiedLineTradeSettlement><ram:SpecifiedTradeSettlementLineMonetarySummation><ram:NetIncludingTaxesLineTotalAmount currencyID="THB">10.13</ram:NetIncludingTaxesLineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation></ram:SpecifiedLineTradeSettlement></ram:IncludedSupplyChainTradeLineItem></rsm:SupplyChainTradeTransaction></rsm:Receipt_CrossIndustryInvoice>
    `
    
var doctype_map = {
    "80": "ใบเพิ่มหนี้",
    "81": "ใบลดหนี้",
    "380": "ใบแจ้งหนี้",
    "388": "ใบกากับภาษี",
    "T01": "ใบรับ",
    "T02": "ใบแจ้งหนี้/ใบกากับภาษี",
    "T03": "ใบเสร็จรับเงิน/ใบกากับภาษี",
    "T04": "ใบส่งของ/ใบกากับภาษี",
    "T05": "ใบกากับภาษีอย่างย่อ"
}

var currency_map = ["THB","USD","JPY","CHN","SGD","KRW","RUB","INR","IDR","VND","MYR","SAR"]
var tax_map = {
    "TXID" : 13,
    "NIDN" :13,
    "CCPT" : 0,
    "OTHR" : "N/A"
}

let check_field = (objData) => {
    let rcii = "rsm:Receipt_CrossIndustryInvoice",
            edc = "rsm:ExchangedDocumentContext",
                gsdcp = "ram:GuidelineSpecifiedDocumentContextParameter",
                    //ram:ID
                        //schemeAgencyID
                        //schemeVersionID
                        //textNode
            ed =   "rsm:ExchangedDocumentContext",
                //ram:ID
                //ram:Name
                //ram:TypeCode
                //ram:IssueDateTime
                //ram:CreationDateTime
            sctt = "rsm:SupplyChainTradeTransaction",
                ahta = "ram:ApplicableHeaderTradeAgreement",
                    stp = "ram:SellerTradeParty",
                        //ram:Name
                        str = "ram:SpecifiedTaxRegistration",
                            //ram:ID
                                //schemeID
                                //textNode
                        pta = "ram:PostalTradeAddress",
                            //ram:PostcodeCode
                            //ram:LineOne
                            //ram:LineTwo
                            //ram:CityName
                            //ram:CitySubDivisionName
                            //ram:CountryID
                                //schemeID
                                //textNode
                            //ram:CountrySubDivisionID
                            //ram:BuildingNumber
                    btp = "ram:BuyerTradeParty",
                        //ram:Name
                        //ram:SpecifiedTaxRegistration
                        //ram:PostalTradeAddress
                ahtd = "ram:ApplicableHeaderTradeDelivery",
                ahts = "ram:ApplicableHeaderTradeSettlement",
                    stshms = "ram:SpecifiedTradeSettlementHeaderMonetarySummation",
                        gta = "ram:GrandTotalAmount",
                            //currencyID
                            //textNode
                isctl = "ram:IncludedSupplyChainTradeLineItem",
                    adld = "ram:AssociatedDocumentLineDocument",
                        //ram:LineID
                    stpr = "ram:SpecifiedTradeProduct",
                        //ram:Name
                    slta= "ram:SpecifiedLineTradeAgreement",
                    sltd = "ram:SpecifiedLineTradeDelivery",
                        bq = "ram:BilledQuantity",
                    slts= "ram:SpecifiedLineTradeSettlement",
                        stslms = "ram:SpecifiedTradeSettlementLineMonetarySummation",
                            nitlta = "ram:NetIncludingTaxesLineTotalAmount"
                            //currencyID
                            //textNode
    console.log(objData[rcii][edc][gsdcp])
                
}

parser.xmlToJson(xml, (err,json)=>{
    if(err) {
	console.log(err)
        //error handling
	return
    }
    console.log(JSON.stringify(json))
    //validator_a = ajv.compile(schema["a"])
    //var valid = validator_a(json);
    var valid = ajv.validate(schema["rct"], json)
    console.log(valid)
    if (!valid){
        console.log(ajv.errors); 
        return
    } 

    
    console.log(doctype_map)
    console.log(json["rsm:Receipt_CrossIndustryInvoice"]["rsm:ExchangedDocumentContext"]["ram:GuidelineSpecifiedDocumentContextParameter"])
    console.log(json["rsm:Receipt_CrossIndustryInvoice"]["rsm:ExchangedDocument"])
    var objExchDoc = json["rsm:Receipt_CrossIndustryInvoice"]["rsm:ExchangedDocument"]
    if(doctype_map[objExchDoc["ram:TypeCode"]] == objExchDoc["ram:Name"]){
        console.log("Match!!")
        console.log(objExchDoc["ram:TypeCode"],objExchDoc["ram:Name"])
    }

    check_field(json)
	//json is converted xml
});

