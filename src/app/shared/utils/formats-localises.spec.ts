import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LangueService } from '../../core/i18n/langue.service';
import { Langue } from '../../core/i18n/langues';
import { absent, formatsLocalises } from './formats-localises';

describe('formatsLocalises', () => {
  function preparer(langue: Langue) {
    const langueActive = signal<Langue>(langue);
    TestBed.configureTestingModule({ providers: [{ provide: LangueService, useValue: { langueActive } }] });
    return { formats: TestBed.runInInjectionContext(() => formatsLocalises()), langueActive };
  }

  it('met les nombres et les décimales à fixes dans la langue active', () => {
    const { formats } = preparer('fr');

    expect(formats.nombre(1776)).toBe(new Intl.NumberFormat('fr').format(1776));
    expect(formats.decimal(-14.2718, 5)).toBe(new Intl.NumberFormat('fr', { minimumFractionDigits: 5, maximumFractionDigits: 5 }).format(-14.2718));
  });

  it('suit le changement de langue', () => {
    const { formats, langueActive } = preparer('fr');
    const enFrancais = formats.nombre(1234567.5);

    langueActive.set('en');

    expect(formats.nombre(1234567.5)).toBe(new Intl.NumberFormat('en').format(1234567.5));
    expect(formats.nombre(1234567.5)).not.toBe(enFrancais);
  });

  it('garde la langue des documents en français ou en anglais, le français en repli (malgache)', () => {
    const { formats, langueActive } = preparer('en');
    expect(formats.langueDocument()).toBe('en');

    langueActive.set('mg');
    expect(formats.langueDocument()).toBe('fr');
  });

  it('expose le marqueur d’une donnée absente', () => {
    expect(preparer('fr').formats.absent).toBe(absent);
    expect(absent).toBe('–');
  });
});
