import { observable, action } from "mobx";
import { pushOrPop } from "../../utils";

class SystemStore {
    @observable activeCar = []

    // single || mul
    @observable selectMode = 'mul'

    @action.bound changeActiveCar = carId => {
        const newId = pushOrPop(this.activeCar, carId, this.selectMode)
        this.activeCar = newId
    }

    @action.bound resetCar = carId => {
        if (this.selectMode === 'mul') {
            this.changeActiveCar(carId)
        } else {
            this.activeCar = [carId]
        }
    }
}

const systemStore = new SystemStore()
export default systemStore
