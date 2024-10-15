import app from "@adonisjs/core/services/app";
import TheService from "../app/service/TheService.js";
 
 

app.ready(() => {

  if (app.getEnvironment() === "web") {
    console.log("booting 3")
    TheService.boot()
    console.log('Gpio service booted')
  } 

 

})
