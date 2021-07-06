import { observable, action } from "mobx";
import { pushOrPop } from "../../utils";

class SystemStore {
    @observable activeCar = []

    // single || mul
    @observable selectMode = 'mul'

    @observable selectDay = '01/06/2014'

    @action.bound changeSelectDay = time => {
        this.selectDay = time
    }

    @action.bound changeActiveCar = carId => {
        const newId = pushOrPop(this.activeCar, carId, this.selectMode)
        this.activeCar = newId
    }

    @action.bound resetCar = carId => {
        this.activeCar = carId
    }
}

const systemStore = new SystemStore()
export default systemStore
