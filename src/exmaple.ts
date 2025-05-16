import CreateAutoMonitor, { MethodLabel } from "./index";

const AutoMonitor = CreateAutoMonitor((args) => {
  //Add logger or metrics here....
  console.log(args);
});

@AutoMonitor('WeatherApi', ['city'])
class WeatherApi {
  public city: string;
  public temperature: number;
  public humidity: number;
  constructor(city: string) {
    this.city = city;
    this.temperature = 20;
    this.humidity = 50;
  }

  async getWeather() {
    return { city: this.city, temperature: 20 };
  }
  @MethodLabel((city: string) => ({
    city
  }))
  setCity(city: string) {
    this.city = city;
  }  

  somethingWrong() {
    throw new Error("Something wrong");
  }
}


async function main(){
    const weatherApi = new WeatherApi("Taipei");
    await weatherApi.getWeather();
    weatherApi.setCity("Tokyo");
    await weatherApi.getWeather();
    try{
      weatherApi.somethingWrong();
    }catch(err){
      return;
    }
}

main();

