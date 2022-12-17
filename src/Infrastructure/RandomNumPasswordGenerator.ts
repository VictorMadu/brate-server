import NumPasswordGenerator from '../Application/Common/Interfaces/Services/NumPasswordGenerator';

export default class RandomNumPasswordGenerator implements NumPasswordGenerator {
    generate(length: number): string {
        return ((Math.random() * 10 ** length) | 0).toString();
    }
}
