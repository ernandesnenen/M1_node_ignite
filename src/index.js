const express = require('express')
const {v4: uuid} = require('uuid')


const app = express()
app.use(express.json())

const customers = []
// -------------------------------------------------------------------
function getBalance(statement){
    const balance = statement.reduce((acc, operation)=>{
        if(operation.type === 'credit'){
            return acc + operation.amount
        }else{
            return acc - operation.amount 
        }

    }, 0)

    return balance

}

function verifyIfExistsAccountCpf(req, res, next){
    const{cpf} = req.headers
    const customer = customers.find(item => item.cpf === cpf)
    if(!customer){
        return res.json({error: 'customer not found'})
    }
    req.customer = customer
    return next()
}
// -------------------------------------------------------------------
app.get('/account',verifyIfExistsAccountCpf, (req, res)=>{
    const { customer} = req
    if(!customer){
        return res.status(400).json({error:'data not found'})
    }else{
       
        res.status(200).json(customer)
    }

})

app.post('/account', (req, res)=>{
const {name, cpf} = req.body


const customerAlreadyExisty = customers.some( item =>  item.cpf === cpf)
if(customerAlreadyExisty){
    return  res.status(400).json({erro:'customer Already Existy'})
}
customers.push({
    id: uuid(),
    name,
    cpf,
    statement:[]
})
return res.status(201).send()
})

app.put('/account',verifyIfExistsAccountCpf, (req, res)=>{
    const {name} =req.body
    const { customer } = req
    
    if(!customer){
        return res.status(400).json({error:'data not found'})
    }else{
        customer.name = name
        res.status(200).send()
    }


})

app.delete('/account',verifyIfExistsAccountCpf, (req, res)=>{
    const {customer} = req
    if(!customer){
        return res.status(400).json({error:'data not found'})
    }else{
       
        customers.splice(customer, 1)
        res.status(200).json( customers)
    }

})

app.get('/statement',verifyIfExistsAccountCpf, (req, res)=>{
    const{customer} = req
    if(!customer){
        return res.status(400).json({error:'data not found'})
    }else{
        res.json(customer.statement)
      
    }
})

app.get('/statement/date',verifyIfExistsAccountCpf, (req, res)=>{
    const{customer} = req
    const {date} = req.query
    const dateFormat = new Date(date + " 00:00")
       
    const statement = customer.statement.filter(item => item.create_at.toDateString() === new Date(dateFormat).toDateString())
   
     return res.json(statement)
      
   
})

app.post('/deposit', verifyIfExistsAccountCpf,(req, res)=>{
    const{customer} = req
    const {description, amount} = req.body
    const statemenOperation = {
        description,
        amount,
        create_at: new Date(),
        type: "credit"
    }

     customer.statement.push(statemenOperation)
     
     return res.status(201).send()

})

app.post('/withdraw', verifyIfExistsAccountCpf,(req, res)=>{
    const {amount} = req.body
    const{customer} = req

    const balance = getBalance(customer.statement)

    if(balance < amount){
        return res.status(400).json({error:'insufficient fund!'})
    }

    const statemenOperation = {
        amount,
        create_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statemenOperation)
     
    return res.status(201).send()



})

app.get('/balance', verifyIfExistsAccountCpf, (req, res)=>{
    const {customer} = req
  
    const balance = getBalance(customer.statement)
    return res.json(balance)

})
// --------------------------------------------------------------------
app.listen('3333', ()=>{console.log('server is run')})