import {Float} from "./float";
import {INumeric} from "./_numeric";

export class Packed implements INumeric {
  private value: number;
  private readonly length: number;
  private readonly decimals: number;
  private readonly qualifiedName: string | undefined;

  public constructor(input?: {length?: number, decimals?: number, qualifiedName?: string}) {
    this.value = 0;

    this.length = 666;
    if (input?.length) {
      this.length = input.length;
    }

    this.decimals = 0;
    if (input?.decimals) {
      this.decimals = input.decimals;
    }

    this.qualifiedName = input?.qualifiedName;
  }

  public getQualifiedName() {
    return this.qualifiedName;
  }

  public set(value: INumeric | number | string) {
    if (typeof value === "number") {
      this.value = value;
    } else if (typeof value === "string") {
      this.value = parseFloat(value);
    } else if (value instanceof Float) {
      this.value = value.getRaw();
    } else {
      this.value = value.get();
    }
  }

  public getLength() {
    return this.length;
  }

  public getDecimals() {
    return this.decimals;
  }

  public clear(): void {
    this.value = 0;
  }

  public get(): number {
    return this.value;
  }
}